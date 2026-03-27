import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import { applyFilters } from '@/lib/query'
import type { ClienteForm } from '@/types/clientes'

export async function getClientes({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('clientes').select('*').eq('tenant_id', tenantId).order('nombre_razon_social')
  q = applyFilters(q, filters)
  if (search) q = q.ilike('nombre_razon_social', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getCliente(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).eq('tenant_id', tenantId).single()
  if (error) throw error
  return data
}

export async function createCliente(form: ClienteForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('clientes').insert({ ...form, tenant_id: tenantId }).select().single()
  if (error) throw error
  return data
}

export async function updateCliente(id: string, form: Partial<ClienteForm>) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('clientes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', tenantId).select().single()
  if (error) throw error
  return data
}

export async function deleteCliente(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}