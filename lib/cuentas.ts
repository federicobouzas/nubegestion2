import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { CuentaForm } from '@/types/cuentas'

export async function getCuentas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre')
  if (error) throw error

  // Calcular saldo real para cada cuenta
  const result = await Promise.all((data || []).map(async (c: any) => {
    const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
    return { ...c, saldo_actual: saldo ?? 0 }
  }))
  return result
}

export async function getCuenta(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: id })
  return { ...data, saldo_actual: saldo ?? 0 }
}

export async function createCuenta(form: CuentaForm) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas')
    .insert({ ...form, tenant_id: TENANT_ID, saldo_inicial: 0, saldo_actual: 0 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCuenta(id: string, form: CuentaForm) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas')
    .update(form)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single()
  if (error) throw error
  return data
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

export function tipoCuentaLabel(tipo: string) {
  const map: Record<string, string> = { efectivo: 'Efectivo', banco: 'Banco', a_cobrar: 'A Cobrar', a_pagar: 'A Pagar' }
  return map[tipo] || tipo
}
