export interface AdelantoCliente {
  id: string
  tenant_id: string
  cliente_id: string
  cuenta_id: string
  fecha: string
  importe_original: number
  importe: number
  created_at: string
  clientes?: { nombre_razon_social: string }
  cuentas?: { nombre: string }
}

export interface AdelantoClienteForm {
  cliente_id: string
  cuenta_id: string
  fecha: string
  importe: number
}
