export type TipoTicket = 'soporte' | 'error' | 'requerimiento' | 'pagos' | 'consulta'
export type CriticidadTicket = 'baja' | 'media' | 'alta' | 'critica'
export type EstadoTicket = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'

export const TIPOS_TICKET: Record<TipoTicket, string> = {
  soporte: 'Soporte Aplicación',
  error: 'Error Aplicación',
  requerimiento: 'Solicitar Funcionalidad',
  pagos: 'Consulta Sobre Pagos',
  consulta: 'Consulta General',
}

export const CRITICIDADES: Record<CriticidadTicket, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítico',
}

export const ESTADOS_TICKET: Record<EstadoTicket, string> = {
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export interface Ticket {
  id: string
  tenant_id: string
  codigo: string
  titulo: string
  descripcion: string | null
  tipo: TipoTicket
  criticidad: CriticidadTicket
  estado: EstadoTicket
  created_at: string
  updated_at: string
}

export interface TicketForm {
  titulo: string
  descripcion: string
  tipo: TipoTicket
  criticidad: CriticidadTicket
  estado: EstadoTicket
}

export interface TicketComentario {
  id: string
  tenant_id: string
  ticket_id: string
  contenido: string
  tipo_autor: 'usuario' | 'soporte'
  created_at: string
}
