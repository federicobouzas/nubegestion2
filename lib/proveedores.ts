import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import { applyFilters } from '@/lib/query'
import type { ProveedorForm } from '@/types/proveedores'

export async function getProveedores({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('proveedores').select('*').eq('tenant_id', tenantId).order('nombre_razon_social')
  q = applyFilters(q, filters)
  if (search) q = q.ilike('nombre_razon_social', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getProveedor(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('proveedores').select('*').eq('id', id).eq('tenant_id', tenantId).single()
  if (error) throw error
  return data
}

export async function createProveedor(form: ProveedorForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('proveedores').insert({ ...form, tenant_id: tenantId }).select().single()
  if (error) throw error
  return data
}

export async function updateProveedor(id: string, form: Partial<ProveedorForm>) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('proveedores').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', tenantId).select().single()
  if (error) throw error
  return data
}

export async function deleteProveedor(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase.from('proveedores').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}