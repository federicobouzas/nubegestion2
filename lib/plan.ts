import { createServerSupabase } from './supabase-server'

export type Plan = 'free' | 'pro' | 'business'

export interface PlanDef {
  id: string
  slug: Plan
  nombre: string
  precio: number
  facturasMes: number | null  // null = ilimitado
  usuarios: number | null
  features: string[]
}

export interface PlanInfo {
  plan: Plan
  planEndsAt: string | null
  planChoiceMade: boolean
  isActive: boolean
  diasVencido: number
  inGracePeriod: boolean
  needsChoiceScreen: boolean
}

// Fallback si la tabla planes aún no tiene los datos
const FALLBACK_LIMITS: Record<Plan, Pick<PlanDef, 'facturasMes' | 'usuarios'>> = {
  free:     { facturasMes: 50,  usuarios: 1 },
  pro:      { facturasMes: 300, usuarios: 3 },
  business: { facturasMes: null, usuarios: null },
}

export function getPlanLimits(plan: Plan) {
  return FALLBACK_LIMITS[plan]
}

export async function getPlanes(): Promise<PlanDef[]> {
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase
      .from('planes')
      .select('id, slug, nombre, precio_mensual, facturas_mes, usuarios, features')
      .not('slug', 'is', null)
      .order('precio_mensual', { ascending: true })

    if (!data?.length) return []
    return data.map(p => ({
      id: p.id,
      slug: p.slug as Plan,
      nombre: p.nombre,
      precio: Number(p.precio_mensual ?? 0),
      facturasMes: p.facturas_mes ?? null,
      usuarios: p.usuarios ?? null,
      features: Array.isArray(p.features) ? p.features : [],
    }))
  } catch {
    return []
  }
}

export async function getPlanInfo(): Promise<PlanInfo> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return makeFreeInfo()

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.tenant_id) return makeFreeInfo()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan, plan_ends_at, plan_choice_made')
      .eq('id', usuario.tenant_id)
      .single()

    const plan: Plan = (tenant?.plan as Plan) || 'free'
    const planEndsAt: string | null = tenant?.plan_ends_at || null
    const planChoiceMade: boolean = tenant?.plan_choice_made || false

    if (plan === 'free') {
      return { plan, planEndsAt: null, planChoiceMade, isActive: true, diasVencido: 0, inGracePeriod: false, needsChoiceScreen: false }
    }

    const now = new Date()
    const endsAt = planEndsAt ? new Date(planEndsAt) : null
    const isActive = endsAt ? endsAt > now : false
    const diasVencido = endsAt && !isActive
      ? Math.floor((now.getTime() - endsAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const inGracePeriod = !isActive && diasVencido >= 1 && diasVencido <= 7
    const needsChoiceScreen = !isActive && diasVencido > 7 && !planChoiceMade

    return { plan, planEndsAt, planChoiceMade, isActive, diasVencido, inGracePeriod, needsChoiceScreen }
  } catch {
    return makeFreeInfo()
  }
}

function makeFreeInfo(): PlanInfo {
  return { plan: 'free', planEndsAt: null, planChoiceMade: false, isActive: true, diasVencido: 0, inGracePeriod: false, needsChoiceScreen: false }
}

// Chequeo server-side del límite de facturas del mes
export async function getFacturasLimitInfo(): Promise<{ limit: number | null; total: number }> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { limit: FALLBACK_LIMITS.free.facturasMes, total: 0 }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.tenant_id) return { limit: FALLBACK_LIMITS.free.facturasMes, total: 0 }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan, plan_ends_at')
      .eq('id', usuario.tenant_id)
      .single()

    const plan: Plan = (tenant?.plan as Plan) || 'free'
    const endsAt = tenant?.plan_ends_at ? new Date(tenant.plan_ends_at) : null
    const isActive = endsAt ? endsAt > new Date() : false

    // business activo = ilimitado
    if (plan === 'business' && isActive) return { limit: null, total: 0 }

    const effectiveSlug: Plan = plan === 'pro' && isActive ? 'pro' : 'free'

    const { data: planDef } = await supabase
      .from('planes')
      .select('facturas_mes')
      .eq('slug', effectiveSlug)
      .single()

    const limit: number = planDef?.facturas_mes ?? FALLBACK_LIMITS[effectiveSlug].facturasMes ?? 50

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ count: cV }, { count: cC }] = await Promise.all([
      supabase
        .from('facturas_venta')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', usuario.tenant_id)
        .gte('created_at', startOfMonth),
      supabase
        .from('facturas_compra')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', usuario.tenant_id)
        .gte('created_at', startOfMonth),
    ])

    return { limit, total: (cV || 0) + (cC || 0) }
  } catch {
    return { limit: null, total: 0 }
  }
}
