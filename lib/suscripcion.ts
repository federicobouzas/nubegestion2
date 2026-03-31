import { createServerSupabase } from './supabase-server'

export type SuscripcionStatus = 'ok' | 'warning' | 'expired'

export interface SuscripcionInfo {
  status: SuscripcionStatus
  diasRestantes: number
  fechaVencimiento: string | null
}

export async function getSuscripcionInfo(): Promise<SuscripcionInfo> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 'ok', diasRestantes: 999, fechaVencimiento: null }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.tenant_id) return { status: 'ok', diasRestantes: 999, fechaVencimiento: null }

    const { data } = await supabase
      .from('suscripciones')
      .select('fecha_vencimiento')
      .eq('tenant_id', usuario.tenant_id)
      .order('fecha_vencimiento', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return { status: 'expired', diasRestantes: -999, fechaVencimiento: null }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(data.fecha_vencimiento + 'T00:00:00')
    vencimiento.setHours(0, 0, 0, 0)
    const diffMs = vencimiento.getTime() - hoy.getTime()
    const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    const diasAlerta = parseInt(process.env.SUSCRIPCION_DIAS_ALERTA || '7')

    let status: SuscripcionStatus = 'ok'
    if (diasRestantes < 0) status = 'expired'
    else if (diasRestantes <= diasAlerta) status = 'warning'

    return { status, diasRestantes, fechaVencimiento: data.fecha_vencimiento }
  } catch {
    return { status: 'ok', diasRestantes: 999, fechaVencimiento: null }
  }
}
