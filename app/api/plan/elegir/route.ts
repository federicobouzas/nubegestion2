import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { choice } = await req.json() as { choice: 'free' }

  if (choice !== 'free') {
    return NextResponse.json({ error: 'choice inválido' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.tenant_id) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })

  const { error } = await supabase
    .from('tenants')
    .update({ plan: 'free', plan_ends_at: null })
    .eq('id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}