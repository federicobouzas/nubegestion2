export interface Servicio {
  id: string
  tenant_id: string
  nombre: string
  descripcion: string | null
  iva: number
  estado: string
  created_at: string
}

export interface ServicioForm {
  nombre: string
  descripcion: string
  iva: number
  estado: string
}

// Tipo unificado para el autocomplete de facturas (productos + servicios)
export interface ItemCatalogo {
  id: string
  tipo: 'producto' | 'servicio'
  nombre: string
  codigo?: string | null
  iva: number
  precio_venta?: number
  stock_actual?: number
  stock_minimo?: number
  unidad_medida?: string
}
