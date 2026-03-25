export type TipoFacturaCompra = 'A' | 'B' | 'C'

export interface ItemFacturaCompra {
  id?: string
  tipo_item: 'producto'
  item_id: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
  descuento_porcentaje: number
  subtotal: number
}

export interface FacturaCompra {
  id: string
  tenant_id: string
  proveedor_id: string
  codigo: string
  numero: string
  tipo: TipoFacturaCompra
  fecha_emision: string
  fecha_vencimiento: string | null
  periodo_desde: string | null
  periodo_hasta: string | null
  condicion_compra: string
  subtotal: number
  impuestos: number
  percepciones: number
  total: number
  saldo_pendiente: number
  notas: string | null
  created_at: string
  updated_at: string
  proveedores?: { nombre_razon_social: string; cuit: string | null; condicion_iva: string }
}

export interface FacturaCompraForm {
  proveedor_id: string
  numero: string
  tipo: TipoFacturaCompra
  fecha_emision: string
  fecha_vencimiento: string
  periodo_desde: string
  periodo_hasta: string
  condicion_compra: string
  notas: string
  items: ItemFacturaCompra[]
  percepciones: { tipo: string; numero_comprobante: string; importe: number }[]
}
