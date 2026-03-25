import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { ReciboCobroForm } from '@/types/cobros'

export async function getRecibosCobro(search?: string) {
  const supabase = createClient()
  let q = supabase
    .from('recibos_cobro')
    .select('*, clientes(nombre_razon_social, cuit)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (search) q = q.ilike('codigo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getReciboCobro(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibos_cobro')
    .select('*, clientes(nombre_razon_social, cuit, condicion_iva, domicilio_fiscal)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function getMetodosCobro(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_cobro_metodos')
    .select('*, cuentas(nombre, tipo)')
    .eq('recibo_cobro_id', recibo_id)
  if (error) throw error
  return data
}

export async function getFacturasCobro(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_cobro_facturas')
    .select('*, facturas_venta(numero, codigo, total)')
    .eq('recibo_cobro_id', recibo_id)
  if (error) throw error
  return data
}

export async function getRetencionesCobro(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_cobro_retenciones')
    .select('*')
    .eq('recibo_cobro_id', recibo_id)
  if (error) throw error
  return data
}

export async function getCuentas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas')
    .select('id, nombre, tipo, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  if (error) throw error

  // Calcular saldo real con función Postgres
  const result = await Promise.all((data || []).map(async (c: any) => {
    const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
    return { ...c, saldo_actual: Number(saldo ?? 0) }
  }))
  return result
}

export async function getFacturasVentaCliente(cliente_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas_venta')
    .select('id, codigo, numero, total, fecha_emision, fecha_vencimiento')
    .eq('tenant_id', TENANT_ID)
    .eq('cliente_id', cliente_id)
    .or('notas.is.null,notas.neq.[ANULADA]')
    .order('fecha_emision', { ascending: true })
  if (error) throw error

  // Calcular saldo real y filtrar las que tienen saldo > 0
  const conSaldo = await Promise.all((data || []).map(async (fv: any) => {
    const { data: saldo } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: fv.id })
    return { ...fv, saldo_pendiente: Number(saldo ?? fv.total) }
  }))

  return conSaldo.filter(f => f.saldo_pendiente > 0)
}

export async function createReciboCobro(form: ReciboCobroForm) {
  const supabase = createClient()

  const { data: codigoData, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: TENANT_ID, p_tipo: 'RC' })
  if (codigoError) throw codigoError

  const totalFacturas = form.facturas.reduce((a, f) => a + Number(f.importe), 0)
  const totalMetodos = form.metodos.reduce((a, m) => a + Number(m.monto), 0)
  const totalRetenciones = form.retenciones.reduce((a, r) => a + Number(r.importe), 0)

  const diferencia = Math.abs(totalFacturas - (totalMetodos + totalRetenciones))
  if (diferencia > 0.01) {
    throw new Error(
      `La suma de facturas (${formatMonto(totalFacturas)}) no coincide con métodos + retenciones (${formatMonto(totalMetodos + totalRetenciones)}).`
    )
  }

  // Validar que importe no supere saldo real de cada factura
  for (const f of form.facturas) {
    const { data: saldo } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: f.factura_venta_id })
    if (Number(f.importe) > Number(saldo ?? 0)) {
      throw new Error(`El importe abonado supera el saldo pendiente de la factura.`)
    }
  }

  const { data: recibo, error } = await supabase
    .from('recibos_cobro')
    .insert({
      tenant_id: TENANT_ID,
      cliente_id: form.cliente_id,
      codigo: codigoData,
      numero: form.numero || null,
      fecha: form.fecha,
      total: totalFacturas,
      notas: form.notas || null,
    })
    .select()
    .single()
  if (error) throw error

  // Insertar facturas
  for (const f of form.facturas) {
    const { error: ef } = await supabase
      .from('recibo_cobro_facturas')
      .insert({
        tenant_id: TENANT_ID,
        recibo_cobro_id: recibo.id,
        factura_venta_id: f.factura_venta_id,
        importe: Number(f.importe),
      })
    if (ef) throw new Error(`Error al guardar factura: ${ef.message}`)
  }

  // Insertar métodos
  for (const m of form.metodos) {
    const { error: em } = await supabase
      .from('recibo_cobro_metodos')
      .insert({
        tenant_id: TENANT_ID,
        recibo_cobro_id: recibo.id,
        cuenta_id: m.cuenta_id,
        importe: Number(m.monto),
      })
    if (em) throw new Error(`Error al guardar método: ${em.message}`)
  }

  // Insertar retenciones
  for (const r of form.retenciones) {
    const { error: er } = await supabase
      .from('recibo_cobro_retenciones')
      .insert({
        tenant_id: TENANT_ID,
        recibo_cobro_id: recibo.id,
        impuesto: r.impuesto,
        tipo: r.impuesto,
        numero_comprobante: r.numero_comprobante || null,
        fecha: r.fecha || null,
        importe: Number(r.importe),
      })
    if (er) throw new Error(`Error al guardar retención: ${er.message}`)
  }

  return recibo
}

export async function anularReciboCobro(id: string) {
  const supabase = createClient()
  // Saldo de facturas se recalcula solo — solo marcar como anulado
  await supabase
    .from('recibos_cobro')
    .update({ notas: '[ANULADO]' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}