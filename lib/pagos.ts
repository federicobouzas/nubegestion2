import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { ReciboPagoForm } from '@/types/pagos'

export async function getRecibosPago(search?: string) {
  const supabase = createClient()
  let q = supabase
    .from('recibos_pago')
    .select('*, proveedores(nombre_razon_social, cuit)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (search) q = q.ilike('codigo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getReciboPago(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibos_pago')
    .select('*, proveedores(nombre_razon_social, cuit, condicion_iva, domicilio_fiscal)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function getMetodosPago(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_pago_metodos')
    .select('*, cuentas(nombre, tipo)')
    .eq('recibo_pago_id', recibo_id)
  if (error) throw error
  return data
}

export async function getFacturasPago(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_pago_facturas')
    .select('*, facturas_compra(numero, codigo, total)')
    .eq('recibo_pago_id', recibo_id)
  if (error) throw error
  return data
}

export async function getRetencionesPago(recibo_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recibo_pago_retenciones')
    .select('*')
    .eq('recibo_pago_id', recibo_id)
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

  const result = await Promise.all((data || []).map(async (c: any) => {
    const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
    return { ...c, saldo_actual: Number(saldo ?? 0) }
  }))
  return result
}

export async function getFacturasCompraProveedor(proveedor_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas_compra')
    .select('id, codigo, numero, total, fecha_emision, fecha_vencimiento')
    .eq('tenant_id', TENANT_ID)
    .eq('proveedor_id', proveedor_id)
    .or('notas.is.null,notas.neq.[ANULADA]')
    .order('fecha_emision', { ascending: true })
  if (error) throw error

  const conSaldo = await Promise.all((data || []).map(async (fc: any) => {
    const { data: saldo } = await supabase.rpc('get_saldo_factura_compra', { p_factura_id: fc.id })
    return { ...fc, saldo_pendiente: Number(saldo ?? fc.total) }
  }))

  return conSaldo.filter(f => f.saldo_pendiente > 0)
}

export async function createReciboPago(form: ReciboPagoForm) {
  const supabase = createClient()

  const { data: codigoData, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: TENANT_ID, p_tipo: 'RP' })
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

  // Validar saldo de cada factura
  for (const f of form.facturas) {
    const { data: saldo } = await supabase.rpc('get_saldo_factura_compra', { p_factura_id: f.factura_compra_id })
    if (Number(f.importe) > Number(saldo ?? 0)) {
      throw new Error(`El importe supera el saldo pendiente de la factura.`)
    }
  }

  // Validar saldo de cada cuenta
  for (const m of form.metodos) {
    const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: m.cuenta_id })
    if (Number(m.monto) > Number(saldo ?? 0)) {
      const { data: cuenta } = await supabase.from('cuentas').select('nombre').eq('id', m.cuenta_id).single()
      throw new Error(`Saldo insuficiente en ${cuenta?.nombre || 'la cuenta'} (disponible: ${formatMonto(Number(saldo ?? 0))}).`)
    }
  }

  const { data: recibo, error } = await supabase
    .from('recibos_pago')
    .insert({
      tenant_id: TENANT_ID,
      proveedor_id: form.proveedor_id,
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
      .from('recibo_pago_facturas')
      .insert({
        tenant_id: TENANT_ID,
        recibo_pago_id: recibo.id,
        factura_compra_id: f.factura_compra_id,
        importe: Number(f.importe),
      })
    if (ef) throw new Error(`Error al guardar factura: ${ef.message}`)
  }

  // Insertar métodos
  for (const m of form.metodos) {
    const { error: em } = await supabase
      .from('recibo_pago_metodos')
      .insert({
        tenant_id: TENANT_ID,
        recibo_pago_id: recibo.id,
        cuenta_id: m.cuenta_id,
        importe: Number(m.monto),
      })
    if (em) throw new Error(`Error al guardar método: ${em.message}`)
  }

  // Insertar retenciones
  for (const r of form.retenciones) {
    const { error: er } = await supabase
      .from('recibo_pago_retenciones')
      .insert({
        tenant_id: TENANT_ID,
        recibo_pago_id: recibo.id,
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

export async function anularReciboPago(id: string) {
  const supabase = createClient()
  await supabase
    .from('recibos_pago')
    .update({ notas: '[ANULADO]' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
