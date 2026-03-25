import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { OtroIngresoForm } from '@/types/otros-ingresos'

export const TIPOS_INGRESO = ['Aportes Socios', 'Préstamos Financieros', 'Otros Ingresos'] as const

export async function getOtrosIngresos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('otros_ingresos')
    .select('*, cuentas(nombre, tipo)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOtroIngreso(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('otros_ingresos')
    .select('*, cuentas(nombre, tipo)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function createOtroIngreso(form: OtroIngresoForm) {
  const supabase = createClient()

  const { data: codigo, error: codErr } = await supabase.rpc('generar_codigo', {
    p_tenant_id: TENANT_ID,
    p_tipo: 'OI',
  })
  if (codErr) throw codErr

  const { data, error } = await supabase
    .from('otros_ingresos')
    .insert({
      fecha: form.fecha,
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || null,
      cuenta_id: form.cuenta_id,
      importe: Number(form.importe),
      notas: form.notas.trim() || null,
      tenant_id: TENANT_ID,
      codigo,
    })
    .select()
    .single()
  if (error) throw error

  const { data: cuenta } = await supabase
    .from('cuentas')
    .select('saldo_actual')
    .eq('id', form.cuenta_id)
    .single()
  if (cuenta) {
    await supabase
      .from('cuentas')
      .update({ saldo_actual: Number(cuenta.saldo_actual ?? 0) + Number(form.importe) })
      .eq('id', form.cuenta_id)
  }

  return data
}

export async function updateOtroIngreso(id: string, form: OtroIngresoForm) {
  const supabase = createClient()

  const { data: anterior } = await supabase
    .from('otros_ingresos')
    .select('importe, cuenta_id')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (!anterior) throw new Error('Ingreso no encontrado')

  const { data: cuentaAnterior } = await supabase
    .from('cuentas')
    .select('saldo_actual')
    .eq('id', anterior.cuenta_id)
    .single()
  if (cuentaAnterior) {
    await supabase
      .from('cuentas')
      .update({ saldo_actual: Number(cuentaAnterior.saldo_actual ?? 0) - Number(anterior.importe) })
      .eq('id', anterior.cuenta_id)
  }

  const { data: cuentaNueva } = await supabase
    .from('cuentas')
    .select('saldo_actual')
    .eq('id', form.cuenta_id)
    .single()
  if (cuentaNueva) {
    await supabase
      .from('cuentas')
      .update({ saldo_actual: Number(cuentaNueva.saldo_actual ?? 0) + Number(form.importe) })
      .eq('id', form.cuenta_id)
  }

  const { data, error } = await supabase
    .from('otros_ingresos')
    .update({
      fecha: form.fecha,
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || null,
      cuenta_id: form.cuenta_id,
      importe: Number(form.importe),
      notas: form.notas.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOtroIngreso(id: string) {
  const supabase = createClient()

  const { data: ingreso } = await supabase
    .from('otros_ingresos')
    .select('importe, cuenta_id')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (ingreso) {
    const { data: cuenta } = await supabase
      .from('cuentas')
      .select('saldo_actual')
      .eq('id', ingreso.cuenta_id)
      .single()
    if (cuenta) {
      await supabase
        .from('cuentas')
        .update({ saldo_actual: Math.max(0, Number(cuenta.saldo_actual ?? 0) - Number(ingreso.importe)) })
        .eq('id', ingreso.cuenta_id)
    }
  }

  const { error } = await supabase.from('otros_ingresos').delete().eq('id', id).eq('tenant_id', TENANT_ID)
  if (error) throw error
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
