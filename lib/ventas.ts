import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { FacturaVentaForm } from '@/types/ventas'

export async function getFacturasVenta(search?: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase
    .from('facturas_venta')
    .select('*, clientes(nombre_razon_social, cuit, condicion_iva)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (search) q = q.ilike('codigo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  const result = await Promise.all((data || []).map(async (fv: any) => {
    const [{ data: total }, { data: saldo }, { data: subtotal }, { data: iva }, { data: percepciones }] = await Promise.all([
      supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: fv.id }),
      supabase.rpc('get_saldo_factura_venta', { p_factura_id: fv.id }),
      supabase.rpc('get_subtotal_factura_venta', { p_factura_id: fv.id }),
      supabase.rpc('get_iva_factura_venta', { p_factura_id: fv.id }),
      supabase.rpc('get_percepciones_factura_venta', { p_factura_id: fv.id }),
    ])
    return { ...fv, total: total ?? 0, saldo_pendiente: saldo ?? 0, subtotal: subtotal ?? 0, impuestos: iva ?? 0, percepciones: percepciones ?? 0 }
  }))
  return result
}

export async function getFacturaVenta(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('facturas_venta')
    .select('*, clientes(nombre_razon_social, cuit, condicion_iva, domicilio_fiscal, localidad, provincia)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  const [{ data: total }, { data: saldo }, { data: subtotal }, { data: iva }, { data: percepciones }] = await Promise.all([
    supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: id }),
    supabase.rpc('get_saldo_factura_venta', { p_factura_id: id }),
    supabase.rpc('get_subtotal_factura_venta', { p_factura_id: id }),
    supabase.rpc('get_iva_factura_venta', { p_factura_id: id }),
    supabase.rpc('get_percepciones_factura_venta', { p_factura_id: id }),
  ])
  return { ...data, total: total ?? 0, saldo_pendiente: saldo ?? 0, subtotal: subtotal ?? 0, impuestos: iva ?? 0, percepciones: percepciones ?? 0 }
}

export async function getItemsFacturaVenta(factura_id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('items_factura_venta')
    .select('*')
    .eq('factura_venta_id', factura_id)
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data
}

export async function getPercepcionesFacturaVenta(factura_id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('percepciones_factura')
    .select('*')
    .eq('factura_id', factura_id)
    .eq('tipo_factura', 'venta')
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data
}

export async function createFacturaVenta(form: FacturaVentaForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: codigoData, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: tenantId, p_tipo: 'FV' })
  if (codigoError) throw codigoError

  const { data: factura, error } = await supabase
    .from('facturas_venta')
    .insert({
      tenant_id: tenantId,
      cliente_id: form.cliente_id,
      codigo: codigoData,
      numero: form.numero,
      tipo: form.tipo,
      fecha_emision: form.fecha_emision,
      fecha_vencimiento: form.fecha_vencimiento || null,
      periodo_desde: form.periodo_desde || null,
      periodo_hasta: form.periodo_hasta || null,
      condicion_venta: form.condicion_venta,
      notas: form.notas || null,
    })
    .select()
    .single()
  if (error) throw error

  if (form.items.length > 0) {
    for (const item of form.items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('nombre, stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', tenantId)
        .single()
      if (!prod) continue
      if (prod.stock_actual < item.cantidad) {
        await supabase.from('facturas_venta').delete().eq('id', factura.id)
        throw new Error(`Stock insuficiente para "${prod.nombre}": disponible ${prod.stock_actual}, requerido ${item.cantidad}.`)
      }
    }

    const { error: itemsError } = await supabase.from('items_factura_venta').insert(
      form.items.map(i => ({ ...i, factura_venta_id: factura.id, tenant_id: tenantId }))
    )
    if (itemsError) throw itemsError

    for (const item of form.items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', tenantId)
        .single()
      if (!prod) continue
      await supabase
        .from('productos')
        .update({ stock_actual: Math.max(0, prod.stock_actual - item.cantidad) })
        .eq('id', item.item_id)
        .eq('tenant_id', tenantId)
    }
  }

  if (form.percepciones.length > 0) {
    await supabase.from('percepciones_factura').insert(
      form.percepciones.filter(p => p.importe > 0).map(p => ({
        ...p, factura_id: factura.id, tipo_factura: 'venta', tenant_id: tenantId
      }))
    )
  }

  return factura
}

export async function grabarCAE(id: string, cae: string, cae_fecha_vencimiento: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('facturas_venta')
    .update({ cae, cae_fecha_vencimiento })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  const { data: saldo } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: id })
  const { data: total } = await supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: id })
  return { ...data, saldo_pendiente: saldo ?? 0, total: total ?? 0 }
}

export async function anularFacturaVenta(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data: items } = await supabase
    .from('items_factura_venta')
    .select('*')
    .eq('factura_venta_id', id)
    .eq('tenant_id', tenantId)
  if (items) {
    for (const item of items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', tenantId)
        .single()
      if (!prod) continue
      await supabase
        .from('productos')
        .update({ stock_actual: (prod.stock_actual || 0) + item.cantidad })
        .eq('id', item.item_id)
        .eq('tenant_id', tenantId)
    }
  }
  const { error } = await supabase
    .from('facturas_venta')
    .update({ notas: '[ANULADA]' })
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

export function calcularEstado(saldo: number, vencimiento: string | null): 'cobrada' | 'vencida' | 'pendiente' {
  if (saldo <= 0) return 'cobrada'
  if (vencimiento && new Date(vencimiento) < new Date()) return 'vencida'
  return 'pendiente'
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}