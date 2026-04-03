import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getUpgradeProEmail } from '@/emails'
import { getPlanLimits } from '@/lib/plan'
import type { Plan } from '@/lib/plan'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Obtener todos los tenants con su plan
  const { data: tenants, error } = await admin
    .from('tenants')
    .select('id, plan')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date()
  const emailMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const resultados: Record<string, string> = {}

  for (const tenant of tenants ?? []) {
    const tenantId = tenant.id
    const plan: Plan = (tenant.plan as Plan) || 'free'

    // Business no tiene límite — saltar
    const limits = getPlanLimits(plan)
    if (!limits.facturasMes) {
      resultados[tenantId] = 'sin límite'
      continue
    }

    const limite = limits.facturasMes

    // Contar facturas del mes
    const [{ count: cV }, { count: cC }] = await Promise.all([
      admin.from('facturas_venta').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('created_at', startOfMonth),
      admin.from('facturas_compra').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('created_at', startOfMonth),
    ])
    const facturasUsadas = (cV || 0) + (cC || 0)

    // Solo alertar si supera el 80%
    if (facturasUsadas < limite * 0.8) {
      resultados[tenantId] = 'bajo límite'
      continue
    }

    // Verificar si ya se envió este mes
    const { data: log } = await admin
      .from('email_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email_type', 'upgrade_pro')
      .eq('email_month', emailMonth)
      .limit(1)

    if (log && log.length > 0) {
      resultados[tenantId] = 'ya enviado este mes'
      continue
    }

    // Obtener el primer usuario admin del tenant
    const { data: adminUser } = await admin
      .from('usuarios')
      .select('id, nombre, email')
      .eq('tenant_id', tenantId)
      .eq('rol', 'admin')
      .limit(1)
      .single()

    if (!adminUser?.email) {
      resultados[tenantId] = 'sin usuario admin'
      continue
    }

    try {
      const html = getUpgradeProEmail({
        nombre: adminUser.nombre || adminUser.email.split('@')[0],
        facturas_usadas: facturasUsadas,
        limite_plan: limite,
      })
      await sendEmail(adminUser.email, 'Estás cerca del límite de tu plan', html)

      await admin.from('email_log').insert({
        tenant_id: tenantId,
        user_id: adminUser.id,
        email_type: 'upgrade_pro',
        email_month: emailMonth,
      })

      resultados[tenantId] = 'enviado'
    } catch (err: any) {
      resultados[tenantId] = `error: ${err?.message}`
      console.error(`[cron/email-upgrade] Tenant ${tenantId}:`, err)
    }
  }

  return NextResponse.json({ procesados: Object.keys(resultados).length, resultados })
}
