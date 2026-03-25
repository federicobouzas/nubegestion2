export type TipoCuenta = 'efectivo' | 'banco' | 'a_cobrar' | 'a_pagar'

export interface Cuenta {
  id: string
  tenant_id: string
  nombre: string
  tipo: TipoCuenta
  saldo_inicial: number
  saldo_actual: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CuentaForm {
  nombre: string
  tipo: TipoCuenta
  activo: boolean
}
