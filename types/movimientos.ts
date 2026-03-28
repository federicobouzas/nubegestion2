export interface MovimientoCuenta {
  id: string
  tenant_id: string
  cuenta_origen_id: string
  cuenta_destino_id: string
  fecha: string
  monto: number
  observacion: string | null
  created_at: string
  cuentas_origen?: { nombre: string }
  cuentas_destino?: { nombre: string }
}

export interface MovimientoCuentaForm {
  cuenta_origen_id: string
  cuenta_destino_id: string
  fecha: string
  monto: number
  observacion: string
}
