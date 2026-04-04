export interface AdelantoProveedor {
  id: string
  tenant_id: string
  proveedor_id: string
  cuenta_id: string
  fecha: string
  importe_original: number
  importe: number
  created_at: string
  proveedores?: { nombre_razon_social: string }
  cuentas?: { nombre: string }
}

export interface AdelantoProveedorForm {
  proveedor_id: string
  cuenta_id: string
  fecha: string
  importe: number
}
