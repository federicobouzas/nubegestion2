import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { ProveedorForm } from '@/types/proveedores'

export async function getProveedores(search?: string) {
  const supabase = createClient()
  let q = supabase.from('proveedores').select('*').eq('tenant_id', TENANT_ID).order('nombre_razon_social')
  if (search) q = q.ilike('nombre_razon_social', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}
export async function getProveedor(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('proveedores').select('*').eq('id', id).eq('tenant_id', TENANT_ID).single()
  if (error) throw error
  return data
}
export async function createProveedor(form: ProveedorForm) {
  const supabase = createClient()
  const { data, error } = await supabase.from('proveedores').insert({ ...form, tenant_id: TENANT_ID }).select().single()
  if (error) throw error
  return data
}
export async function updateProveedor(id: string, form: Partial<ProveedorForm>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('proveedores').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', TENANT_ID).select().single()
  if (error) throw error
  return data
}
export async function deleteProveedor(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('proveedores').delete().eq('id', id).eq('tenant_id', TENANT_ID)
  if (error) throw error
}
