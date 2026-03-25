import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { ClienteForm } from '@/types/clientes'

export async function getClientes(search?: string) {
  const supabase = createClient()
  let q = supabase.from('clientes').select('*').eq('tenant_id', TENANT_ID).order('nombre_razon_social')
  if (search) q = q.ilike('nombre_razon_social', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}
export async function getCliente(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).eq('tenant_id', TENANT_ID).single()
  if (error) throw error
  return data
}
export async function createCliente(form: ClienteForm) {
  const supabase = createClient()
  const { data, error } = await supabase.from('clientes').insert({ ...form, tenant_id: TENANT_ID }).select().single()
  if (error) throw error
  return data
}
export async function updateCliente(id: string, form: Partial<ClienteForm>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('clientes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', TENANT_ID).select().single()
  if (error) throw error
  return data
}
export async function deleteCliente(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('tenant_id', TENANT_ID)
  if (error) throw error
}
