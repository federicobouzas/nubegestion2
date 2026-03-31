import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { TallerForm, InsumoForm, FabricacionForm } from '@/types/produccion'

// ─── Talleres ────────────────────────────────────────────────

export async function getTalleres() {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('talleres')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')
  if (error) throw error
  return data
}

export async function getTaller(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('talleres')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createTaller(form: TallerForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('talleres')
    .insert({ ...form, tenant_id: tenantId })
    .select().single()
  if (error) throw error
  return data
}

export async function updateTaller(id: string, form: TallerForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('talleres')
    .update(form)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select().single()
  if (error) throw error
  return data
}

export async function deleteTaller(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('talleres')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

// ─── Insumos ─────────────────────────────────────────────────

export async function getInsumos(filters: { estado?: string; search?: string } = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase
    .from('insumos_produccion')
    .select('*, proveedores(nombre_razon_social)')
    .eq('tenant_id', tenantId)
    .order('nombre')
  if (filters.estado) q = q.eq('estado', filters.estado)
  if (filters.search) q = q.ilike('nombre', `%${filters.search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getInsumo(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_produccion')
    .select('*, proveedores(nombre_razon_social)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createInsumo(form: InsumoForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_produccion')
    .insert({
      ...form,
      tenant_id: tenantId,
      proveedor_id: form.proveedor_id || null,
    })
    .select().single()
  if (error) throw error
  return data
}

export async function updateInsumo(id: string, form: InsumoForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_produccion')
    .update({
      ...form,
      proveedor_id: form.proveedor_id || null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select().single()
  if (error) throw error
  return data
}

export async function deleteInsumo(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('insumos_produccion')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

export async function ajustarStockInsumo(
  id: string,
  cantidad: number,
  descripcion: string,
  tipo: 'entrada' | 'salida'
) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: insumo, error: eGet } = await supabase
    .from('insumos_produccion')
    .select('stock')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (eGet) throw eGet

  const nuevoStock = tipo === 'entrada'
    ? Number(insumo.stock) + cantidad
    : Number(insumo.stock) - cantidad

  const { error: eUpd } = await supabase
    .from('insumos_produccion')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (eUpd) throw eUpd

  const { error: eMov } = await supabase
    .from('insumos_movimientos')
    .insert({
      tenant_id: tenantId,
      insumo_id: id,
      descripcion,
      entrada: tipo === 'entrada' ? cantidad : 0,
      salida: tipo === 'salida' ? cantidad : 0,
    })
  if (eMov) throw eMov
}

export async function getMovimientosInsumo(insumo_id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_movimientos')
    .select('*')
    .eq('insumo_id', insumo_id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

// ─── Insumos en Productos (recetas) ──────────────────────────

export async function getRecetaProducto(producto_id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_productos')
    .select('*, insumos_produccion(nombre, precio_compra, unidad_medida)')
    .eq('producto_id', producto_id)
    .eq('tenant_id', tenantId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function addInsumoAProducto(producto_id: string, insumo_id: string, cantidad: number) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_productos')
    .insert({ tenant_id: tenantId, producto_id, insumo_id, cantidad })
    .select().single()
  if (error) throw error
  return data
}

export async function updateInsumoEnProducto(id: string, cantidad: number) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('insumos_productos')
    .update({ cantidad })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select().single()
  if (error) throw error
  return data
}

export async function removeInsumoDeProducto(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('insumos_productos')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}

export async function getCostoInsumosProducto(producto_id: string): Promise<number> {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .rpc('get_costo_insumos_producto', { p_tenant_id: tenantId, p_producto_id: producto_id })
  if (error) throw error
  return Number(data ?? 0)
}

// ─── Fabricaciones ────────────────────────────────────────────

export async function getFabricaciones() {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('fabricaciones')
    .select('*, talleres(nombre)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const enriched = await Promise.all((data || []).map(async (fab: any) => {
    const { data: prods, error: ep } = await supabase
      .from('fabricaciones_productos')
      .select('cantidad, costo_total')
      .eq('fabricacion_id', fab.id)
    if (ep) return { ...fab, costo_total: 0, cantidad_productos: 0 }
    const costo_total = (prods || []).reduce((a: number, p: any) => a + Number(p.costo_total), 0)
    return { ...fab, costo_total, cantidad_productos: (prods || []).length }
  }))

  return enriched
}

export async function getFabricacion(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('fabricaciones')
    .select('*, talleres(nombre)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function getFabricacionProductos(fabricacion_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fabricaciones_productos')
    .select('*, productos(nombre)')
    .eq('fabricacion_id', fabricacion_id)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createFabricacion(form: FabricacionForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: codigo, error: codErr } = await supabase
    .rpc('generar_codigo', { p_tenant_id: tenantId, p_tipo: 'FA' })
  if (codErr) throw codErr

  const { data: fab, error } = await supabase
    .from('fabricaciones')
    .insert({
      tenant_id: tenantId,
      codigo,
      fecha_fabricacion: form.fecha_fabricacion,
      fecha_estimada_finalizacion: form.fecha_estimada_finalizacion || null,
      estado: 'en_proceso',
      taller_id: form.taller_id,
    })
    .select().single()
  if (error) throw error

  for (const p of form.productos) {
    const { error: ep } = await supabase
      .from('fabricaciones_productos')
      .insert({
        tenant_id: tenantId,
        fabricacion_id: fab.id,
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        costo_insumos: p.costo_insumos,
        costo_fabricacion: p.costo_fabricacion,
        costo_total: p.costo_total,
        observaciones: p.observaciones || null,
      })
    if (ep) throw ep
  }

  return fab
}

export async function checkStockFabricacion(
  producto_id: string,
  cantidad: number
): Promise<{ status: 'OK' | 'ERROR'; maximo: number }> {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase.rpc('check_stock_fabricacion', {
    p_tenant_id: tenantId,
    p_producto_id: producto_id,
    p_cantidad: cantidad,
  })
  if (error) throw error
  return data as { status: 'OK' | 'ERROR'; maximo: number }
}

export async function finalizarFabricacion(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const productos = await getFabricacionProductos(id)

  for (const fp of (productos || [])) {
    const receta = await getRecetaProducto(fp.producto_id)
    for (const item of (receta || [])) {
      const cantidadUsada = Number(item.cantidad) * fp.cantidad
      await ajustarStockInsumo(
        item.insumo_id,
        cantidadUsada,
        `Fabricación ${id}`,
        'salida'
      )
    }
    const { data: prod } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', fp.producto_id)
      .single()
    if (prod) {
      await supabase
        .from('productos')
        .update({ stock_actual: Number(prod.stock_actual) + fp.cantidad })
        .eq('id', fp.producto_id)
    }
  }

  const { error } = await supabase
    .from('fabricaciones')
    .update({
      estado: 'finalizado',
      fecha_finalizacion: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}
