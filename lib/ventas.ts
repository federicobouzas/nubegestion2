import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { FacturaVentaForm, ItemFacturaVenta, PercepcionFactura } from '@/types/ventas'

export async function getFacturasVenta(search?: string) {
  const supabase = createClient()
  let q = supabase
    .from('facturas_venta')
    .select('*, clientes(nombre_razon_social, cuit, condicion_iva)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (search) q = q.ilike('codigo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getFacturaVenta(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas_venta')
    .select('*, clientes(nombre_razon_social, cuit, condicion_iva, domicilio_fiscal, localidad, provincia)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function getItemsFacturaVenta(factura_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('items_factura_venta')
    .select('*')
    .eq('factura_venta_id', factura_id)
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
  return data
}

export async function getPercepcionesFacturaVenta(factura_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('percepciones_factura')
    .select('*')
    .eq('factura_id', factura_id)
    .eq('tipo_factura', 'venta')
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
  return data
}

export async function createFacturaVenta(form: FacturaVentaForm) {
  const supabase = createClient()

  // Generar código FV
  const { data: codigoData, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: TENANT_ID, p_tipo: 'FV' })
  if (codigoError) throw codigoError

  // Calcular totales
  const subtotal = form.items.reduce((acc, i) => acc + i.subtotal, 0)
  const impuestos = form.items.reduce((acc, i) => {
    const base = i.subtotal * (1 - i.descuento_porcentaje / 100)
    return acc + base * (i.iva_porcentaje / 100)
  }, 0)
  const percepciones = form.percepciones.reduce((acc, p) => acc + p.importe, 0)
  const total = subtotal + impuestos + percepciones

  const { data: factura, error } = await supabase
    .from('facturas_venta')
    .insert({
      tenant_id: TENANT_ID,
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
      subtotal,
      impuestos,
      percepciones,
      total,
      saldo_pendiente: total,
    })
    .select()
    .single()
  if (error) throw error

  // Validar stock y bajar
  if (form.items.length > 0) {
    // Validar stock suficiente
    for (const item of form.items) {
      if (!item.item_id) continue
      const { data: prod } = await supabase
        .from('productos')
        .select('nombre, stock_actual')
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
        .single()
      if (!prod) continue
      if (prod.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para "${prod.nombre}": disponible ${prod.stock_actual}, requerido ${item.cantidad}.`)
      }
    }

    const { error: itemsError } = await supabase.from('items_factura_venta').insert(
      form.items.map(i => ({ ...i, factura_venta_id: factura.id, tenant_id: TENANT_ID }))
    )
    if (itemsError) throw itemsError

    // Bajar stock
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
        .update({ stock_actual: Math.max(0, prod.stock_actual - item.cantidad) })
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
    }
  }

  // Percepciones
  if (form.percepciones.length > 0) {
    const { error: percError } = await supabase.from('percepciones_factura').insert(
      form.percepciones.filter(p => p.importe > 0).map(p => ({
        ...p, factura_id: factura.id, tipo_factura: 'venta', tenant_id: TENANT_ID
      }))
    )
    if (percError) throw percError
  }

  return factura
}

export async function grabarCAE(id: string, cae: string, cae_fecha_vencimiento: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas_venta')
    .update({ cae, cae_fecha_vencimiento })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function anularFacturaVenta(id: string) {
  const supabase = createClient()
  // Revertir stock
  const { data: items } = await supabase
    .from('items_factura_venta')
    .select('*')
    .eq('factura_venta_id', id)
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
        .update({ stock_actual: (prod.stock_actual || 0) + item.cantidad })
        .eq('id', item.item_id)
        .eq('tenant_id', TENANT_ID)
    }
  }
  const { error } = await supabase
    .from('facturas_venta')
    .update({ saldo_pendiente: 0, notas: '[ANULADA]' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
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
