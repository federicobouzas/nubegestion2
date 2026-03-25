import { createClient } from './supabase'
import { TENANT_ID } from './constants'
import type { ProductoForm } from '@/types/productos'

export async function getProductos(search?: string) {
  const supabase = createClient()
  let q = supabase.from('productos').select('*').eq('tenant_id', TENANT_ID).order('nombre')
  if (search) q = q.ilike('nombre', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}
export async function getProducto(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).eq('tenant_id', TENANT_ID).single()
  if (error) throw error
  return data
}
export async function createProducto(form: ProductoForm) {
  const supabase = createClient()
  const { data, error } = await supabase.from('productos').insert({ ...form, tenant_id: TENANT_ID }).select().single()
  if (error) throw error
  return data
}
export async function updateProducto(id: string, form: Partial<ProductoForm>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('productos').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', TENANT_ID).select().single()
  if (error) throw error
  return data
}
export async function deleteProducto(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('productos').delete().eq('id', id).eq('tenant_id', TENANT_ID)
  if (error) throw error
}
