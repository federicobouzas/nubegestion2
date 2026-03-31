export type TipoNotificacion =
  | 'saldo_bajo'
  | 'factura_vencida'
  | 'cheque_por_vencer'
  | 'stock_bajo'
  | 'compra_por_vencer'

export interface Notificacion {
  id: string
  tenant_id: string
  tipo: TipoNotificacion
  referencia_id: string | null
  mensaje: string
  leida: boolean
  created_at: string
  metadata: Record<string, any> | null
}

export const TIPOS: Record<TipoNotificacion, string> = {
  saldo_bajo: 'saldo_bajo',
  factura_vencida: 'factura_vencida',
  cheque_por_vencer: 'cheque_por_vencer',
  stock_bajo: 'stock_bajo',
  compra_por_vencer: 'compra_por_vencer',
}

export const ICONOS: Record<TipoNotificacion, string> = {
  saldo_bajo: '💰',
  factura_vencida: '📄',
  cheque_por_vencer: '🏦',
  stock_bajo: '📦',
  compra_por_vencer: '🛒',
}

export function getNavegacion(tipo: TipoNotificacion, referenciaId: string | null): string {
  switch (tipo) {
    case 'saldo_bajo':       return '/tesoreria/cuentas'
    case 'factura_vencida':  return referenciaId ? `/ventas/${referenciaId}` : '/ventas'
    case 'cheque_por_vencer':return '/tesoreria/cheques'
    case 'stock_bajo':       return referenciaId ? `/productos/${referenciaId}/editar` : '/productos'
    case 'compra_por_vencer':return referenciaId ? `/compras/${referenciaId}` : '/compras'
  }
}

export function tiempoRelativo(created_at: string): string {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  const dias = Math.floor(diff / 86400)
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}
