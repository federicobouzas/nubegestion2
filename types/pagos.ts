export interface ReciboPago {
  id: string
  tenant_id: string
  proveedor_id: string
  codigo: string
  numero: string | null
  fecha: string
  total: number
  notas: string | null
  created_at: string
  proveedores?: { nombre_razon_social: string; cuit: string | null }
}

export interface ReciboPagoMetodo {
  id?: string
  cuenta_id: string
  monto: number
  cuentas?: { nombre: string; tipo: string }
}

export interface ReciboPagoFactura {
  id?: string
  factura_compra_id: string
  importe: number
  facturas_compra?: { numero: string | null; codigo: string; total: number }
}

export interface ReciboPagoRetencion {
  id?: string
  impuesto: string
  numero_comprobante: string
  fecha: string
  importe: number
}

export interface ReciboPagoForm {
  proveedor_id: string
  numero: string
  fecha: string
  notas: string
  facturas: ReciboPagoFactura[]
  metodos: ReciboPagoMetodo[]
  retenciones: ReciboPagoRetencion[]
}
