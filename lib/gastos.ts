import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { CategoriaGastoForm, GastoForm } from '@/types/gastos'

export const TIPOS_CATEGORIA = [
  'Empleados',
  'Impuestos',
  'Marketing',
  'Oficina',
  'Servicios Profesionales',
  'Otro',
]

// ─── Categorías ───────────────────────────────────────────────

export async function getCategoriasGasto() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias_gastos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('tipo').order('descripcion')
  if (error) throw error
  return data
}

export async function getCategoriaGasto(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias_gastos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function createCategoriaGasto(form: CategoriaGastoForm) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias_gastos')
    .insert({ ...form, tenant_id: TENANT_ID })
    .select().single()
  if (error) throw error
  return data
}

export async function updateCategoriaGasto(id: string, form: CategoriaGastoForm) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias_gastos')
    .update(form)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select().single()
  if (error) throw error
  return data
}

export async function deleteCategoriaGasto(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('categorias_gastos')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
}

// ─── Gastos ───────────────────────────────────────────────────

export async function getGastos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categorias_gastos(tipo, descripcion)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGasto(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gastos')
    .select('*, categorias_gastos(tipo, descripcion)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()
  if (error) throw error
  return data
}

export async function getMetodosGasto(gasto_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gasto_metodos')
    .select('*, cuentas(nombre, tipo)')
    .eq('gasto_id', gasto_id)
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

export async function createGasto(form: GastoForm) {
  const supabase = createClient()

  const { data: codigo, error: codErr } = await supabase
    .rpc('generar_codigo', { p_tenant_id: TENANT_ID, p_tipo: 'GA' })
  if (codErr) throw codErr

  const total = form.metodos.reduce((a, m) => a + Number(m.monto), 0)

  // Validar saldo de cuentas
  for (const m of form.metodos) {
    const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: m.cuenta_id })
    if (Number(m.monto) > Number(saldo ?? 0)) {
      const { data: cuenta } = await supabase.from('cuentas').select('nombre').eq('id', m.cuenta_id).single()
      throw new Error(`Saldo insuficiente en ${cuenta?.nombre || 'la cuenta'} (disponible: ${formatMonto(Number(saldo ?? 0))}).`)
    }
  }

  const { data: gasto, error } = await supabase
    .from('gastos')
    .insert({
      tenant_id: TENANT_ID,
      codigo,
      categoria_id: form.categoria_id,
      descripcion: form.descripcion || null,
      numero_factura: form.numero_factura || null,
      fecha_pago: form.fecha_pago,
      total,
      notas: form.notas || null,
    })
    .select().single()
  if (error) throw error

  for (const m of form.metodos) {
    const { error: em } = await supabase
      .from('gasto_metodos')
      .insert({
        tenant_id: TENANT_ID,
        gasto_id: gasto.id,
        cuenta_id: m.cuenta_id,
        importe: Number(m.monto),
      })
    if (em) throw new Error(`Error al guardar método: ${em.message}`)
  }

  return gasto
}

export async function deleteGasto(id: string) {
  const supabase = createClient()
  // saldo de cuentas se recalcula solo
  const { error } = await supabase
    .from('gastos')
    .update({ notas: '[ANULADO]' })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
  if (error) throw error
}

export function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}
