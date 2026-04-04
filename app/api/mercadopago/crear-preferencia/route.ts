import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createServerSupabase } from '@/lib/supabase-server'
import { getTipoCambioUSD } from '@/lib/tipo-cambio'

export async function POST(req: NextRequest) {
  const { plan_slug } = await req.json() as { plan_slug: string }

  if (!plan_slug) {
    return NextResponse.json({ error: 'plan_slug requerido' }, { status: 400 })
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

  const tenantId: string = usuario.tenant_id

  // Buscar plan activo
  const { data: plan, error: planError } = await supabase
    .from('planes')
    .select('id, slug, nombre, precio_mensual')
    .eq('slug', plan_slug)
    .eq('estado', 'activo')
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  let tipoCambio: number
  try {
    tipoCambio = getTipoCambioUSD()
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  const precioARS = Math.round(Number(plan.precio_mensual) * tipoCambio)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
  const preferenceClient = new Preference(client)

  let preference: Awaited<ReturnType<typeof preferenceClient.create>>
  try {
    preference = await preferenceClient.create({
      body: {
        items: [{
          id: `plan-${plan.nombre.toLowerCase()}`,
          title: `Nube Gestión - ${plan.nombre}`,
          unit_price: precioARS,
          quantity: 1,
          currency_id: 'ARS',
        }],
        back_urls: {
          success: `${baseUrl}/suscripcion/aprobado`,
          pending: `${baseUrl}/suscripcion/pendiente`,
          failure: `${baseUrl}/suscripcion/rechazado`,
        },
        auto_return: 'approved',
        external_reference: `${tenantId}|${plan.slug}`,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: {
          tenant_id: tenantId,
          plan_slug: plan.slug,
          plan_id: plan.id,
          user_id: user.id,
        },
      },
    })
  } catch (err: any) {
    console.error('[crear-preferencia] Error MP:', err)
    return NextResponse.json({ error: 'Error creando preferencia en MercadoPago' }, { status: 500 })
  }

  // Registrar suscripcion pendiente
  await supabase.from('suscripciones').insert({
    tenant_id: tenantId,
    user_id: user.id,
    plan_id: plan.id,
    mp_preference_id: preference.id,
    monto: precioARS,
    tipo_cambio: tipoCambio,
    mp_status: 'pending',
    estado: 'pendiente',
    fecha_vencimiento: null,
    periodo_inicio: null,
  })

  return NextResponse.json({ init_point: preference.init_point })
}
