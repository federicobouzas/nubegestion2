import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST /api/setup-tenant
 *
 * Fallback: crea toda la estructura de tenant para el usuario autenticado.
 * El trigger de DB hace esto automáticamente; este endpoint es un safety-net
 * por si el trigger no pudo ejecutarse (e.g. en entornos de desarrollo local).
 * Es idempotente: no falla si las estructuras ya existen.
 */
export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Verificar si ya tiene tenant (el trigger ya lo creó)
  const { data: existing } = await admin
    .from('usuarios')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (existing?.tenant_id) {
    return NextResponse.json({ ok: true, tenantId: existing.tenant_id })
  }

  // Crear estructura completa del tenant
  const nombre = (user.user_metadata?.nombre as string | undefined)?.trim() || user.email?.split('@')[0] || 'Usuario'
  const empresa = (user.user_metadata?.empresa as string | undefined)?.trim() || 'Mi Empresa'

  // 1. Tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ nombre: empresa, email: user.email, activo: true })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Error creando tenant', detail: tenantError?.message }, { status: 500 })
  }

  const tenantId = tenant.id

  // 2. Usuario
  await admin.from('usuarios').insert({
    id: user.id,
    nombre,
    email: user.email,
    tenant_id: tenantId,
    rol: 'admin',
    activo: true,
  })

  // 3. Relación usuario ↔ tenant
  await admin.from('usuario_tenant').insert({
    user_id: user.id,
    tenant_id: tenantId,
    rol: 'admin',
    activo: true,
  })

  // 4. Configuración vacía
  await admin.from('configuracion').insert({ tenant_id: tenantId })

  // 5. Contadores
  await admin.from('contadores').insert([
    { tenant_id: tenantId, tipo: 'GA', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'OI', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'FV', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'FC', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'RP', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'RC', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'FA', ultimo_numero: 0 },
    { tenant_id: tenantId, tipo: 'TK', ultimo_numero: 0 },
  ])

  return NextResponse.json({ ok: true, tenantId })
}
