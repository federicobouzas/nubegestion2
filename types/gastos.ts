export interface CategoriaGasto {
  id: string
  tenant_id: string
  tipo: string
  descripcion: string
  estado: string
  created_at: string
}

export interface CategoriaGastoForm {
  tipo: string
  descripcion: string
  estado: string
}

export interface GastoMetodo {
  id?: string
  cuenta_id: string
  monto: number
  cuentas?: { nombre: string; tipo: string }
}

export interface Gasto {
  id: string
  tenant_id: string
  codigo: string
  categoria_id: string
  descripcion: string | null
  numero_factura: string | null
  fecha_pago: string
  total: number
  notas: string | null
  created_at: string
  categorias_gastos?: { tipo: string; descripcion: string }
}

export interface GastoForm {
  categoria_id: string
  descripcion: string
  numero_factura: string
  fecha_pago: string
  notas: string
  metodos: GastoMetodo[]
}
