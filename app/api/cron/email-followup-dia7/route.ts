import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getFollowupDia7Email } from '@/emails'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  const now = new Date()
  const dia7Start = new Date(now)
  dia7Start.setDate(dia7Start.getDate() - 7)
  dia7Start.setHours(0, 0, 0, 0)
  const dia7End = new Date(dia7Start)
  dia7End.setHours(23, 59, 59, 999)

  const { data: usuarios, error } = await admin
    .from('usuarios')
    .select('id, nombre, email, tenant_id')
    .gte('created_at', dia7Start.toISOString())
    .lte('created_at', dia7End.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados: Record<string, string> = {}

  for (const usuario of usuarios ?? []) {
    const { id: userId, nombre, email, tenant_id: tenantId } = usuario
    if (!email || !tenantId) continue

    const { data: log } = await admin
      .from('email_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('email_type', 'followup_dia7')
      .limit(1)

    if (log && log.length > 0) {
      resultados[userId] = 'ya enviado'
      continue
    }

    try {
      const html = getFollowupDia7Email({
        nombre: nombre || email.split('@')[0],
        email,
      })
      await sendEmail(email, 'Una semana con Nube Gestión — ¿todo bien?', html)

      await admin.from('email_log').insert({
        tenant_id: tenantId,
        user_id: userId,
        email_type: 'followup_dia7',
      })

      resultados[userId] = 'enviado'
    } catch (err: any) {
      resultados[userId] = `error: ${err?.message}`
      console.error(`[cron/email-followup-dia7] Usuario ${userId}:`, err)
    }
  }

  return NextResponse.json({ procesados: Object.keys(resultados).length, resultados })
}
