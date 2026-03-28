import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { MovimientoCuentaForm } from '@/types/movimientos'

export async function getMovimiento(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('movimientos_cuentas')
    .select('*, cuentas_origen:cuenta_origen_id(nombre), cuentas_destino:cuenta_destino_id(nombre)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createMovimiento(form: MovimientoCuentaForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('movimientos_cuentas')
    .insert({
      tenant_id: tenantId,
      cuenta_origen_id: form.cuenta_origen_id,
      cuenta_destino_id: form.cuenta_destino_id,
      fecha: form.fecha,
      monto: Number(form.monto),
      observacion: form.observacion?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMovimiento(id: string, form: MovimientoCuentaForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('movimientos_cuentas')
    .update({
      cuenta_origen_id: form.cuenta_origen_id,
      cuenta_destino_id: form.cuenta_destino_id,
      fecha: form.fecha,
      monto: Number(form.monto),
      observacion: form.observacion?.trim() || null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMovimiento(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('movimientos_cuentas')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
