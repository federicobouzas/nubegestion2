import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { AdelantoProveedorForm } from '@/types/adelantos-proveedores'

export async function getAdelantosProveedores(filters: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase
    .from('adelantos_proveedores')
    .select('*, proveedores(nombre_razon_social), cuentas(nombre)')
    .eq('tenant_id', tenantId)
    .order('fecha', { ascending: false })
  if (filters.proveedor_id) q = q.eq('proveedor_id', filters.proveedor_id)
  if (filters.cuenta_id)    q = q.eq('cuenta_id', filters.cuenta_id)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getAdelantoProveedor(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('adelantos_proveedores')
    .select('*, proveedores(nombre_razon_social), cuentas(nombre)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createAdelantoProveedor(form: AdelantoProveedorForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  // Validación: no aceptar adelantos si el proveedor tiene facturas pendientes de pago
  const { data: proveedor } = await supabase
    .from('clientes')
    .select('cuenta_corriente')
    .eq('id', form.proveedor_id)
    .eq('tenant_id', tenantId)
    .single()

  const { data: cc } = await supabase.rpc('get_cc_proveedores', { p_tenant_id: tenantId })
  const proveedorCC = cc?.find((r: any) => r.proveedor_id === form.proveedor_id)
  if ((proveedorCC?.saldo ?? 0) > 0) {
    throw new Error('El proveedor tiene facturas pendientes de pago')
  }

  const { data, error } = await supabase
    .from('adelantos_proveedores')
    .insert({
      tenant_id: tenantId,
      proveedor_id: form.proveedor_id,
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

export async function updateAdelantoProveedor(id: string, form: AdelantoProveedorForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: actual } = await supabase
    .from('adelantos_proveedores')
    .select('importe, importe_original')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!actual) throw new Error('Adelanto no encontrado')
  if (Number(actual.importe) !== Number(actual.importe_original)) {
    throw new Error('No se puede editar un adelanto que fue consumido parcialmente')
  }

  const { data, error } = await supabase
    .from('adelantos_proveedores')
    .update({
      proveedor_id: form.proveedor_id,
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

export async function deleteAdelantoProveedor(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: actual } = await supabase
    .from('adelantos_proveedores')
    .select('importe, importe_original')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!actual) throw new Error('Adelanto no encontrado')
  if (Number(actual.importe) !== Number(actual.importe_original)) {
    throw new Error('No se puede eliminar un adelanto que fue consumido parcialmente')
  }

  const { error } = await supabase
    .from('adelantos_proveedores')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

/**
 * Consumir adelantos del proveedor al guardar una factura de compra.
 * Llamar al final de createFacturaCompra, pasando el id y total de la factura.
 */
export async function consumirAdelantosProveedor(
  facturaId: string,
  proveedorId: string,
  tenantId: string,
  totalFactura: number,
) {
  const supabase = createClient()

  const { data: adelantos } = await supabase
    .from('adelantos_proveedores')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('proveedor_id', proveedorId)
    .gt('importe', 0)
    .order('fecha', { ascending: true })

  if (!adelantos?.length) return

  let restante = totalFactura
  const hoy = new Date().toISOString().split('T')[0]

  for (const adelanto of adelantos) {
    if (restante <= 0) break

    const aPagar = Math.min(Number(adelanto.importe), restante)

    const { data: codigoData } = await supabase.rpc('generar_codigo', {
      p_tenant_id: tenantId,
      p_tipo: 'RP',
    })

    const { data: recibo } = await supabase
      .from('recibos_pago')
      .insert({
        tenant_id: tenantId,
        proveedor_id: proveedorId,
        codigo: codigoData,
        fecha: hoy,
        notas: 'Generado automáticamente desde adelanto',
      })
      .select()
      .single()

    if (!recibo) continue

    await supabase.from('recibo_pago_facturas').insert({
      tenant_id: tenantId,
      recibo_pago_id: recibo.id,
      factura_compra_id: facturaId,
      importe: aPagar,
    })

    await supabase.from('recibo_pago_metodos').insert({
      tenant_id: tenantId,
      recibo_pago_id: recibo.id,
      cuenta_id: adelanto.cuenta_id,
      importe: aPagar,
    })

    await supabase
      .from('adelantos_proveedores')
      .update({ importe: Number(adelanto.importe) - aPagar })
      .eq('id', adelanto.id)

    restante -= aPagar
  }
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
