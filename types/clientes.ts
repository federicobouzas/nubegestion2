export type CondicionIVA = 'RI' | 'Mono' | 'Exento' | 'CF'
export type TipoFactura = 'A' | 'B' | 'C' | 'E' | 'M'
export type EstadoCliente = 'activo' | 'inactivo'
export interface Cliente {
  id: string; tenant_id: string; nombre_razon_social: string; cuit: string | null
  condicion_iva: CondicionIVA; domicilio_fiscal: string | null; direccion: string | null
  localidad: string | null; provincia: string | null; codigo_postal: string | null
  telefono: string | null; email: string | null; web: string | null
  tipo_factura: TipoFactura; estado: EstadoCliente; created_at: string; updated_at: string
}
export interface ClienteForm {
  nombre_razon_social: string; cuit: string; condicion_iva: CondicionIVA
  domicilio_fiscal: string; direccion: string; localidad: string; provincia: string
  codigo_postal: string; telefono: string; email: string; web: string
  tipo_factura: TipoFactura; estado: EstadoCliente
}
