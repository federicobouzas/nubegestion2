import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { Plan } from './plan'

// Fallback si la tabla planes aún no tiene slug/facturas_mes
const FALLBACK_FACTURAS: Record<Plan, number | null> = {
  free: 50,
  pro: 300,
  business: null,
}

export async function checkPlanLimit(): Promise<void> {
  const supabase = createClient()
  const tenantId = await getTenantId()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan, plan_ends_at')
    .eq('id', tenantId)
    .single()

  const plan: Plan = (tenant?.plan as Plan) || 'free'
  const endsAt = tenant?.plan_ends_at ? new Date(tenant.plan_ends_at) : null
  const isActive = endsAt ? endsAt > new Date() : false

  // business activo = ilimitado
  if (plan === 'business' && isActive) return

  // Leer límite desde la tabla planes
  let limit: number | null = null
  const effectiveSlug: Plan = (plan === 'pro' && isActive) ? 'pro' : 'free'

  const { data: planDef } = await supabase
    .from('planes')
    .select('facturas_mes')
    .eq('slug', effectiveSlug)
    .single()

  limit = planDef?.facturas_mes ?? FALLBACK_FACTURAS[effectiveSlug]

  if (limit === null) return

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ count: cV }, { count: cC }] = await Promise.all([
    supabase
      .from('facturas_venta')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth),
    supabase
      .from('facturas_compra')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth),
  ])

  const total = (cV || 0) + (cC || 0)
  if (total >= limit) {
    const label = effectiveSlug === 'free' ? 'gratuito' : effectiveSlug
    throw new Error(
      `Límite de facturas alcanzado: el plan ${label} permite ${limit} facturas por mes. Este mes ya tenés ${total}.`
    )
  }
}
