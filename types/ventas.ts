export type TipoFactura = 'A' | 'B' | 'C' | 'E' | 'M'
export type EstadoFactura = 'pendiente' | 'cobrada' | 'vencida'
export type TipoItem = 'producto' | 'servicio'

export interface ItemFacturaVenta {
  id?: string
  tipo_item: TipoItem
  producto_id: string | null
  servicio_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
  descuento_porcentaje: number
  subtotal: number
}

export interface PercepcionFactura {
  id?: string
  tipo: string
  numero_comprobante: string
  importe: number
}

export interface FacturaVenta {
  id: string
  tenant_id: string
  cliente_id: string
  codigo: string
  numero: string
  tipo: TipoFactura
  fecha_emision: string
  fecha_vencimiento: string | null
  periodo_desde: string | null
  periodo_hasta: string | null
  condicion_venta: string
  subtotal: number
  impuestos: number
  percepciones: number
  total: number
  saldo_pendiente: number
  cae: string | null
  cae_fecha_vencimiento: string | null
  notas: string | null
  created_at: string
  updated_at: string
  // joins
  clientes?: { nombre_razon_social: string; cuit: string | null; condicion_iva: string }
}

export interface FacturaVentaForm {
  cliente_id: string
  numero: string
  tipo: TipoFactura
  fecha_emision: string
  fecha_vencimiento: string
  periodo_desde: string
  periodo_hasta: string
  condicion_venta: string
  notas: string
  items: ItemFacturaVenta[]
  percepciones: PercepcionFactura[]
}
