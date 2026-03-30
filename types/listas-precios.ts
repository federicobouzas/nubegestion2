export interface ListaPrecio {
  id: string
  tenant_id: string
  nombre: string
  estado: string
  created_at: string
}

export interface ListaPrecioForm {
  nombre: string
  estado: string
}

export interface PrecioProducto {
  id: string
  tenant_id: string
  producto_id: string
  lista_precio_id: string
  precio: number
  created_at: string
}

export interface ProductoConPrecio {
  id: string
  nombre: string
  codigo: string | null
  precio: number | null
}
