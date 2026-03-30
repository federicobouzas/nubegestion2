import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { ServicioForm } from '@/types/servicios'

export async function getServicios({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('servicios').select('*').eq('tenant_id', tenantId).order('nombre')
  if (filters.estado) q = q.eq('estado', filters.estado)
  if (search) q = q.ilike('nombre', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getServicio(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createServicio(form: ServicioForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('servicios')
    .insert({ ...form, tenant_id: tenantId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateServicio(id: string, form: Partial<ServicioForm>) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('servicios')
    .update(form)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteServicio(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}
