import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('usuarios').select('tenant_id').eq('id', user.id).single()
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })

  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
    .eq('tenant_id', userRow.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
