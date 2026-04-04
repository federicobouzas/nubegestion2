import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .single()

  if (!currentUser?.tenant_id || currentUser.rol !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { nombre, email, password, rol } = await req.json()

  if (!nombre?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { nombre: nombre.trim() },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Error al crear usuario.' }, { status: 500 })
  }

  const newUserId = authData.user.id

  await admin.from('usuarios').insert({
    id: newUserId,
    nombre: nombre.trim(),
    email: email.trim(),
    tenant_id: currentUser.tenant_id,
    rol: rol || 'usuario',
    activo: true,
  })

  await admin.from('usuario_tenant').insert({
    user_id: newUserId,
    tenant_id: currentUser.tenant_id,
    rol: rol || 'usuario',
    activo: true,
  })

  return NextResponse.json({ id: newUserId })
}
