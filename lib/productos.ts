import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import { applyFilters } from '@/lib/query'
import type { ProductoForm } from '@/types/productos'

export async function getProductos({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('productos').select('*').eq('tenant_id', tenantId).order('nombre')
  q = applyFilters(q, filters)
  if (search) q = q.ilike('nombre', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getProducto(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).eq('tenant_id', tenantId).single()
  if (error) throw error
  return data
}

export async function createProducto(form: ProductoForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('productos').insert({ ...form, tenant_id: tenantId }).select().single()
  if (error) throw error
  return data
}

export async function updateProducto(id: string, form: Partial<ProductoForm>) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.from('productos').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', tenantId).select().single()
  if (error) throw error
  return data
}

export async function deleteProducto(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase.from('productos').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}