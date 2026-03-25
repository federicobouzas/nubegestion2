export interface ReciboCobro {
  id: string
  tenant_id: string
  cliente_id: string
  codigo: string
  numero: string | null
  fecha: string
  total: number
  notas: string | null
  created_at: string
  clientes?: { nombre_razon_social: string; cuit: string | null }
}

export interface ReciboCobroMetodo {
  id?: string
  cuenta_id: string
  monto: number
  cuentas?: { nombre: string; tipo: string; saldo_actual: number }
}

export interface FacturaVentaCobroRow {
  id: string
  codigo: string
  numero: string | null
  total: number
  saldo_pendiente: number
  fecha_emision?: string
  fecha_vencimiento?: string | null
}

export interface ReciboCobroFactura {
  id?: string
  factura_venta_id: string
  importe: number
  _factura?: FacturaVentaCobroRow
  facturas_venta?: { numero: string | null; codigo: string; total: number; saldo_pendiente: number }
}

export interface ReciboCobroRetencion {
  id?: string
  impuesto: string
  numero_comprobante: string
  fecha: string
  importe: number
}

export interface ReciboCobroForm {
  cliente_id: string
  numero: string
  fecha: string
  notas: string
  facturas: ReciboCobroFactura[]
  metodos: ReciboCobroMetodo[]
  retenciones: ReciboCobroRetencion[]
}
