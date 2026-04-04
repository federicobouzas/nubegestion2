import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

async function getAdminContext(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUser } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .single()

  if (!currentUser?.tenant_id || currentUser.rol !== 'admin') return null

  return { userId: user.id, tenantId: currentUser.tenant_id }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { activo } = await req.json()
  const admin = createAdminClient()

  await admin.from('usuarios')
    .update({ activo })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  await admin.from('usuario_tenant')
    .update({ activo })
    .eq('user_id', id)
    .eq('tenant_id', ctx.tenantId)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  if (id === ctx.userId) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo.' }, { status: 400 })
  }

  const admin = createAdminClient()

  await admin.from('usuario_tenant')
    .delete()
    .eq('user_id', id)
    .eq('tenant_id', ctx.tenantId)

  await admin.from('usuarios')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  await admin.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
