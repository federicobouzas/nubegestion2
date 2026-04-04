import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { AdelantoClienteForm } from '@/types/adelantos-clientes'

export async function getAdelantosClientes(filters: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase
    .from('adelantos_clientes')
    .select('*, clientes(nombre_razon_social), cuentas(nombre)')
    .eq('tenant_id', tenantId)
    .order('fecha', { ascending: false })
  if (filters.cliente_id) q = q.eq('cliente_id', filters.cliente_id)
  if (filters.cuenta_id)  q = q.eq('cuenta_id', filters.cuenta_id)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getAdelantoCliente(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('adelantos_clientes')
    .select('*, clientes(nombre_razon_social), cuentas(nombre)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createAdelantoCliente(form: AdelantoClienteForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  // Validación: no aceptar adelantos si el cliente tiene facturas pendientes de cobro
  const { data: cliente } = await supabase
    .from('clientes')
    .select('cuenta_corriente')
    .eq('id', form.cliente_id)
    .eq('tenant_id', tenantId)
    .single()

  const { data: cc } = await supabase.rpc('get_cc_clientes', { p_tenant_id: tenantId })
  const clienteCC = cc?.find((r: any) => r.cliente_id === form.cliente_id)
  if ((clienteCC?.saldo ?? 0) > 0) {
    throw new Error('El cliente tiene facturas pendientes de cobro')
  }

  const { data, error } = await supabase
    .from('adelantos_clientes')
    .insert({
      tenant_id: tenantId,
      cliente_id: form.cliente_id,
      cuenta_id: form.cuenta_id,
      fecha: form.fecha,
      importe_original: Number(form.importe),
      importe: Number(form.importe),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAdelantoCliente(id: string, form: AdelantoClienteForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: actual } = await supabase
    .from('adelantos_clientes')
    .select('importe, importe_original')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!actual) throw new Error('Adelanto no encontrado')
  if (Number(actual.importe) !== Number(actual.importe_original)) {
    throw new Error('No se puede editar un adelanto que fue consumido parcialmente')
  }

  const { data, error } = await supabase
    .from('adelantos_clientes')
    .update({
      cliente_id: form.cliente_id,
      cuenta_id: form.cuenta_id,
      fecha: form.fecha,
      importe_original: Number(form.importe),
      importe: Number(form.importe),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAdelantoCliente(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: actual } = await supabase
    .from('adelantos_clientes')
    .select('importe, importe_original')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!actual) throw new Error('Adelanto no encontrado')
  if (Number(actual.importe) !== Number(actual.importe_original)) {
    throw new Error('No se puede eliminar un adelanto que fue consumido parcialmente')
  }

  const { error } = await supabase
    .from('adelantos_clientes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

/**
 * Consumir adelantos del cliente al guardar una factura de venta.
 * Llamar al final de createFacturaVenta, pasando el id y total de la factura.
 */
export async function consumirAdelantosCliente(
  facturaId: string,
  clienteId: string,
  tenantId: string,
  totalFactura: number,
) {
  const supabase = createClient()

  const { data: adelantos } = await supabase
    .from('adelantos_clientes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cliente_id', clienteId)
    .gt('importe', 0)
    .order('fecha', { ascending: true })

  if (!adelantos?.length) return

  let restante = totalFactura
  const hoy = new Date().toISOString().split('T')[0]

  for (const adelanto of adelantos) {
    if (restante <= 0) break

    const aCobrar = Math.min(Number(adelanto.importe), restante)

    const { data: codigoData } = await supabase.rpc('generar_codigo', {
      p_tenant_id: tenantId,
      p_tipo: 'RC',
    })

    const { data: recibo } = await supabase
      .from('recibos_cobro')
      .insert({
        tenant_id: tenantId,
        cliente_id: clienteId,
        codigo: codigoData,
        fecha: hoy,
        notas: 'Generado automáticamente desde adelanto',
      })
      .select()
      .single()

    if (!recibo) continue

    await supabase.from('recibo_cobro_facturas').insert({
      tenant_id: tenantId,
      recibo_cobro_id: recibo.id,
      factura_venta_id: facturaId,
      importe: aCobrar,
    })

    await supabase.from('recibo_cobro_metodos').insert({
      tenant_id: tenantId,
      recibo_cobro_id: recibo.id,
      cuenta_id: adelanto.cuenta_id,
      importe: aCobrar,
    })

    await supabase
      .from('adelantos_clientes')
      .update({ importe: Number(adelanto.importe) - aCobrar })
      .eq('id', adelanto.id)

    restante -= aCobrar
  }
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
