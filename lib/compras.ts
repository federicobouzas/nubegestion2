import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { FacturaCompraForm } from '@/types/compras'

export async function getFacturasCompra(search?: string) {
  const supabase = createClient()
  let q = supabase
    .from('facturas_compra')
    .select('*, proveedores(nombre_razon_social, cuit, condicion_iva)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (search) q = q.ilike('codigo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getFacturaCompra(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas_compra')
    .select('*, proveedores(nombre_razon_social, cuit, condicion_iva, domicilio_fiscal, localidad, provincia)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function getItemsFacturaCompra(factura_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('items_factura_compra')
    .select('*')
    .eq('factura_compra_id', factura_id)
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
  return data
}

export async function getPercepcionesFacturaCompra(factura_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('percepciones_factura')
    .select('*')
    .eq('factura_id', factura_id)
    .eq('tipo_factura', 'compra')
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
  return data
}

export async function createFacturaCompra(form: FacturaCompraForm) {
  const supabase = createClient()

  const { data: codigoData, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: TENANT_ID, p_tipo: 'FC' })
  if (codigoError) throw codigoError

  const subtotal = form.items.reduce((acc, i) => acc + i.subtotal, 0)
  const impuestos = form.items.reduce((acc, i) => acc + i.subtotal * (i.iva_porcentaje / 100), 0)
  const percepciones = form.percepciones.reduce((acc, p) => acc + p.importe, 0)
  const total = subtotal + impuestos + percepciones

  const { data: factura, error } = await supabase
    .from('facturas_compra')
    .insert({
      tenant_id: TENANT_ID,
      proveedor_id: form.proveedor_id,
      codigo: codigoData,
      numero: form.numero,
      tipo: form.tipo,
      fecha_emision: form.fecha_emision,
      fecha_vencimiento: form.fecha_vencimiento || null,
      periodo_desde: form.periodo_desde || null,
      periodo_hasta: form.periodo_hasta || null,
      condicion_compra: form.condicion_compra,
      notas: form.notas || null,
      subtotal, impuestos, percepciones, total,
      saldo_pendiente: total,
    })
    .select()
    .single()
  if (error) throw error

  if (form.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('items_factura_compra')
      .insert(form.items.map(i => ({ ...i, factura_compra_id: factura.id, tenant_id: TENANT_ID })))
    if (itemsError) throw itemsError

    // Subir stock y actualizar precio_compra
    for (const item of form.items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
        .single()
      if (!prod) continue
      await supabase
        .from('productos')
        .update({
          stock_actual: (prod.stock_actual || 0) + Number(item.cantidad),
          precio_compra: Number(item.precio_unitario),
        })
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
    }
  }

  if (form.percepciones.length > 0) {
    await supabase.from('percepciones_factura').insert(
      form.percepciones
        .filter(p => p.importe > 0)
        .map(p => ({ ...p, factura_id: factura.id, tipo_factura: 'compra', tenant_id: TENANT_ID }))
    )
  }

  return factura
}

export async function anularFacturaCompra(id: string) {
  const supabase = createClient()
  const { data: items } = await supabase
    .from('items_factura_compra')
    .select('*')
    .eq('factura_compra_id', id)
    .eq('tenant_id', TENANT_ID)

  if (items) {
    for (const item of items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
        .single()
      if (!prod) continue
      await supabase
        .from('productos')
        .update({ stock_actual: Math.max(0, (prod.stock_actual || 0) - Number(item.cantidad)) })
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
    }
  }

  await supabase
    .from('facturas_compra')
    .update({ saldo_pendiente: 0, notas: '[ANULADA]' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
}

export function calcularEstadoCompra(saldo: number, vencimiento: string | null): 'pagada' | 'vencida' | 'pendiente' {
  if (saldo <= 0) return 'pagada'
  if (vencimiento && new Date(vencimiento) < new Date()) return 'vencida'
  return 'pendiente'
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
