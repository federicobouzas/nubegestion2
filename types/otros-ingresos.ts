export interface OtroIngreso {
  id: string
  tenant_id: string
  codigo: string | null
  fecha: string
  tipo: string
  descripcion: string | null
  cuenta_id: string
  importe: number
  notas: string | null
  created_at: string
  updated_at?: string
  cuentas?: { nombre: string; tipo: string }
}

export interface OtroIngresoForm {
  fecha: string
  tipo: string
  descripcion: string
  cuenta_id: string
  importe: number
  notas: string
}
