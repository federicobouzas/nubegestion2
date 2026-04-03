import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTipoCambioUSD } from '@/lib/tipo-cambio'
import { sendEmail } from '@/lib/email'
import { getReciboPagoEmail, getPagoFallidoEmail } from '@/emails'

const MOTIVO_FALLO: Record<string, string> = {
  cc_rejected_insufficient_amount:      'Fondos insuficientes en la tarjeta',
  cc_rejected_bad_filled_card_number:   'Número de tarjeta incorrecto',
  cc_rejected_bad_filled_date:          'Fecha de vencimiento incorrecta',
  cc_rejected_bad_filled_other:         'Datos de la tarjeta incorrectos',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_blacklist:                'Tarjeta bloqueada por el banco emisor',
  cc_rejected_call_for_authorize:       'El banco requiere autorización previa',
  cc_rejected_card_disabled:            'Tarjeta deshabilitada',
  cc_rejected_card_error:               'Error en la tarjeta',
  cc_rejected_duplicated_payment:       'Pago duplicado detectado',
  cc_rejected_high_risk:                'Rechazado por riesgo de seguridad',
  cc_rejected_max_attempts:             'Límite de intentos alcanzado',
  cc_rejected_other_reason:             'Rechazado por el banco',
  rejected_by_bank:                     'Rechazado por el banco',
  rejected_insufficient_data:           'Datos insuficientes',
  by_admin:                             'Cancelado por el administrador',
  expired:                              'Pago expirado',
}

function fmtMonto(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  const { plan_slug, token, paymentMethodId } = await req.json() as {
    plan_slug: string
    token: string
    paymentMethodId: string
  }

  if (!plan_slug || !token || !paymentMethodId) {
    return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 })
  }

  // Autenticar usuario
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, nombre')
    .eq('id', user.id)
    .single()
  if (!usuario?.tenant_id) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })

  const tenantId: string = usuario.tenant_id
  const email: string = user.email ?? ''
  const nombre: string = usuario.nombre || email.split('@')[0]

  // Buscar plan
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

  // Llamar a MP /v1/payments
  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: precioARS,
      description: `Nube Gestión - ${plan.nombre}`,
      payment_method_id: paymentMethodId,
      installments: 1,
      token,
      external_reference: `${tenantId}|${plan.slug}`,
      payer: { email },
    }),
  })

  const payment = await mpRes.json()
  const status: string = payment.status ?? 'error'
  const statusDetail: string = payment.status_detail ?? ''
  const admin = createAdminClient()

  const now = new Date()
  const periodoInicio = now.toISOString().split('T')[0]
  const fechaVencimiento = new Date(now)
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)
  const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

  if (status === 'approved') {
    await Promise.all([
      admin.from('suscripciones').insert({
        tenant_id: tenantId,
        user_id: user.id,
        plan_id: plan.id,
        plan: plan.slug,
        monto: precioARS,
        tipo_cambio: tipoCambio,
        mp_payment_id: String(payment.id),
        mp_status: status,
        estado: 'activa',
        periodo_inicio: periodoInicio,
        fecha_vencimiento: fechaVencimientoStr,
      }),
      admin.from('tenants').update({
        plan: plan.slug,
        plan_id: plan.id,
        plan_ends_at: fechaVencimiento.toISOString(),
      }).eq('id', tenantId),
    ])

    try {
      const fechaPago = fmtFecha(now.toISOString())
      const proximaFecha = fmtFecha(fechaVencimiento.toISOString())
      const html = getReciboPagoEmail({
        nombre,
        comprobante_id: String(payment.id),
        plan_nombre: plan.nombre,
        periodo: `${fechaPago} — ${proximaFecha}`,
        metodo_pago: paymentMethodId,
        fecha_pago: fechaPago,
        monto: precioARS,
        proxima_fecha: proximaFecha,
      })
      await sendEmail(email, `Recibo de pago — ${fmtMonto(precioARS)}`, html)
    } catch (err) {
      console.error('[mercadopago/pagar] Error enviando recibo:', err)
    }

    return NextResponse.json({ status: 'approved' })
  }

  if (status === 'rejected') {
    await admin.from('suscripciones').insert({
      tenant_id: tenantId,
      user_id: user.id,
      plan_id: plan.id,
      plan: plan.slug,
      monto: precioARS,
      tipo_cambio: tipoCambio,
      mp_payment_id: String(payment.id),
      mp_status: status,
      estado: 'suspendida',
    })

    try {
      const html = getPagoFallidoEmail({
        nombre,
        plan_nombre: plan.nombre,
        monto: precioARS,
        metodo_pago: paymentMethodId,
        motivo_fallo: MOTIVO_FALLO[statusDetail] ?? 'El pago no pudo procesarse',
        dias_gracia: 7,
      })
      await sendEmail(email, 'Hubo un problema con tu pago — Nube Gestión', html)
    } catch (err) {
      console.error('[mercadopago/pagar] Error enviando email fallo:', err)
    }

    return NextResponse.json({
      status: 'rejected',
      detail: MOTIVO_FALLO[statusDetail] ?? 'El pago fue rechazado',
    })
  }

  // in_process / pending
  await admin.from('suscripciones').insert({
    tenant_id: tenantId,
    user_id: user.id,
    plan_id: plan.id,
    plan: plan.slug,
    monto: precioARS,
    tipo_cambio: tipoCambio,
    mp_payment_id: String(payment.id),
    mp_status: status,
    estado: 'pendiente',
  })

  return NextResponse.json({ status: 'pending' })
}
