import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getFollowupDia3Email } from '@/emails'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Usuarios creados hace exactamente 3 días (ventana de ±12 h)
  const now = new Date()
  const dia3Start = new Date(now)
  dia3Start.setDate(dia3Start.getDate() - 3)
  dia3Start.setHours(0, 0, 0, 0)
  const dia3End = new Date(dia3Start)
  dia3End.setHours(23, 59, 59, 999)

  const { data: usuarios, error } = await admin
    .from('usuarios')
    .select('id, nombre, email, tenant_id')
    .gte('created_at', dia3Start.toISOString())
    .lte('created_at', dia3End.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados: Record<string, string> = {}

  for (const usuario of usuarios ?? []) {
    const { id: userId, nombre, email, tenant_id: tenantId } = usuario
    if (!email || !tenantId) continue

    // Verificar si ya recibió este email
    const { data: log } = await admin
      .from('email_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('email_type', 'followup_dia3')
      .limit(1)

    if (log && log.length > 0) {
      resultados[userId] = 'ya enviado'
      continue
    }

    // Contar facturas del mes actual para este tenant
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const [{ count: cV }, { count: cC }] = await Promise.all([
      admin.from('facturas_venta').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('created_at', startOfMonth),
      admin.from('facturas_compra').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('created_at', startOfMonth),
    ])
    const facturasUsadas = (cV || 0) + (cC || 0)

    // Pasos completados: cuenta cuántas secciones tienen datos (configuracion, clientes, productos)
    const [{ count: configCount }, { count: clientesCount }, { count: productosCount }] = await Promise.all([
      admin.from('configuracion').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).not('razon_social', 'is', null),
      admin.from('clientes').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      admin.from('productos').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ])
    const pasosCompletados = [configCount, clientesCount, productosCount].filter(c => (c ?? 0) > 0).length

    try {
      const html = getFollowupDia3Email({
        nombre: nombre || email.split('@')[0],
        facturas_usadas: facturasUsadas,
        pasos_completados: pasosCompletados,
      })
      await sendEmail(email, '¿Cómo vas con Nube Gestión?', html)

      await admin.from('email_log').insert({
        tenant_id: tenantId,
        user_id: userId,
        email_type: 'followup_dia3',
      })

      resultados[userId] = 'enviado'
    } catch (err: any) {
      resultados[userId] = `error: ${err?.message}`
      console.error(`[cron/email-followup] Usuario ${userId}:`, err)
    }
  }

  return NextResponse.json({ procesados: Object.keys(resultados).length, resultados })
}
