import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

async function getTenantIdServer() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await supabase
    .from('usuarios').select('tenant_id').eq('id', user.id).single()
  return data?.tenant_id ?? null
}

export async function GET() {
  const supabase = await createServerSupabase()
  const tenantId = await getTenantIdServer()
  if (!tenantId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('leida', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unreadCount = (data ?? []).filter((n: any) => !n.leida).length
  return NextResponse.json({ notificaciones: data ?? [], unreadCount })
}
