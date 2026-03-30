// SQL para crear las tablas en Supabase:
//
// CREATE TABLE listas_precios (
//   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
//   tenant_id uuid NOT NULL,
//   nombre text NOT NULL,
//   estado text NOT NULL DEFAULT 'activo',
//   created_at timestamptz DEFAULT now() NOT NULL
// );
//
// CREATE TABLE precios_por_producto (
//   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
//   tenant_id uuid NOT NULL,
//   producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
//   lista_precio_id uuid NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
//   precio numeric(15,2) NOT NULL DEFAULT 0,
//   created_at timestamptz DEFAULT now() NOT NULL,
//   UNIQUE (tenant_id, producto_id, lista_precio_id)
// );

import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import { applyFilters } from '@/lib/query'
import type { ListaPrecioForm, ProductoConPrecio } from '@/types/listas-precios'

// ─── Listas de Precios ────────────────────────────────────────


export async function getListasPrecios({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('listas_precios').select('*').eq('tenant_id', tenantId).order('nombre')
  q = applyFilters(q, filters)
  if (search) q = q.ilike('nombre_razon_social', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getListaPrecio(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('listas_precios')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createListaPrecio(form: ListaPrecioForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('listas_precios')
    .insert({ ...form, tenant_id: tenantId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateListaPrecio(id: string, form: ListaPrecioForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('listas_precios')
    .update(form)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteListaPrecio(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('listas_precios')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

// ─── Precios por Producto ─────────────────────────────────────

export async function getPreciosProducto(producto_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('precios_por_producto')
    .select('*')
    .eq('producto_id', producto_id)
  if (error) throw error
  return data
}

export async function upsertPreciosProducto(
  producto_id: string,
  precios: { lista_precio_id: string; precio: number | null }[]
) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const toUpsert = precios
    .filter(p => p.precio !== null && p.precio !== undefined)
    .map(p => ({
      tenant_id: tenantId,
      producto_id,
      lista_precio_id: p.lista_precio_id,
      precio: p.precio as number,
    }))

  if (toUpsert.length === 0) return

  const { error } = await supabase
    .from('precios_por_producto')
    .upsert(toUpsert, { onConflict: 'tenant_id,producto_id,lista_precio_id' })
  if (error) throw error
}

// ─── Para actualización masiva ────────────────────────────────

export async function getProductosConPrecios(lista_precio_id: string): Promise<ProductoConPrecio[]> {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const [{ data: productos, error }, { data: precios }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, nombre, codigo')
      .eq('tenant_id', tenantId)
      .eq('estado', 'activo')
      .order('nombre'),
    supabase
      .from('precios_por_producto')
      .select('producto_id, precio')
      .eq('lista_precio_id', lista_precio_id)
      .eq('tenant_id', tenantId),
  ])
  if (error) throw error

  const preciosMap = new Map((precios || []).map(p => [p.producto_id, Number(p.precio)]))
  return (productos || []).map(p => ({
    ...p,
    precio: preciosMap.has(p.id) ? preciosMap.get(p.id)! : null,
  }))
}

export async function actualizarPreciosMasivo(
  lista_precio_id: string,
  updates: { nombre: string; precio: number }[]
): Promise<{ updated: number; notFound: number }> {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('tenant_id', tenantId)

  const productoMap = new Map(
    (productos || []).map(p => [p.nombre.toLowerCase().trim(), p.id])
  )

  const toUpsert: { tenant_id: string; producto_id: string; lista_precio_id: string; precio: number }[] = []
  let notFound = 0

  for (const row of updates) {
    const productoId = productoMap.get(row.nombre.toLowerCase().trim())
    if (!productoId) { notFound++; continue }
    toUpsert.push({ tenant_id: tenantId, producto_id: productoId, lista_precio_id, precio: row.precio })
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from('precios_por_producto')
      .upsert(toUpsert, { onConflict: 'tenant_id,producto_id,lista_precio_id' })
    if (error) throw error
  }

  return { updated: toUpsert.length, notFound }
}
