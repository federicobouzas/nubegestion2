export interface Producto {
  id: string; tenant_id: string; categoria_id: string | null; codigo: string | null
  nombre: string; descripcion: string | null; precio_compra: number; precio_venta: number
  iva: number; unidad_medida: string; stock_actual: number; stock_minimo: number
  estado: string; created_at: string; updated_at: string
}
export interface ProductoForm {
  codigo: string; nombre: string; descripcion: string; precio_compra: number
  precio_venta: number; iva: number; unidad_medida: string
  stock_actual: number; stock_minimo: number; estado: string
}
