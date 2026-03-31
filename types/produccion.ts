export interface Taller {
  id: string
  tenant_id: string
  nombre: string
  created_at: string
}

export interface TallerForm {
  nombre: string
}

export interface Insumo {
  id: string
  tenant_id: string
  nombre: string
  precio_compra: number
  unidad_medida: string
  proveedor_id: string | null
  stock: number
  iva: number
  estado: string
  observaciones: string | null
  created_at: string
  proveedores?: { nombre_razon_social: string }
}

export interface InsumoForm {
  nombre: string
  precio_compra: number
  unidad_medida: string
  proveedor_id: string
  iva: number
  estado: string
  observaciones: string
}

export interface InsumoProducto {
  id: string
  tenant_id: string
  insumo_id: string
  producto_id: string
  cantidad: number
  created_at: string
  insumos_produccion?: { nombre: string; precio_compra: number; unidad_medida: string }
}

export interface Fabricacion {
  id: string
  tenant_id: string
  codigo: string
  fecha_fabricacion: string
  fecha_estimada_finalizacion: string | null
  fecha_finalizacion: string | null
  estado: string
  taller_id: string
  created_at: string
  talleres?: { nombre: string }
  costo_total?: number
  cantidad_productos?: number
}

export interface FabricacionProducto {
  id: string
  fabricacion_id: string
  producto_id: string
  cantidad: number
  costo_insumos: number
  costo_fabricacion: number
  costo_total: number
  observaciones: string | null
  productos?: { nombre: string }
}

export interface FabricacionProductoForm {
  producto_id: string
  cantidad: number
  costo_insumos: number
  costo_fabricacion: number
  costo_total: number
  observaciones: string
}

export interface FabricacionForm {
  fecha_fabricacion: string
  fecha_estimada_finalizacion: string
  taller_id: string
  estado: string
  productos: FabricacionProductoForm[]
}
