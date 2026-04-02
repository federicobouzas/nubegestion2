import { createServerSupabase } from './supabase-server'

export type Plan = 'free' | 'pro' | 'business'

export interface PlanInfo {
  plan: Plan
  planEndsAt: string | null
  planChoiceMade: boolean
  isActive: boolean
  diasVencido: number
  inGracePeriod: boolean
  needsChoiceScreen: boolean
}

export function getPlanLimits(plan: Plan) {
  return {
    facturasMes: plan === 'free' ? 50 : plan === 'pro' ? 300 : null,
    usuarios: plan === 'free' ? 1 : plan === 'pro' ? 3 : null,
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
