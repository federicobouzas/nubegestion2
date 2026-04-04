import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getReciboPagoEmail, getPagoFallidoEmail } from '@/emails'

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

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

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const dataId = new URL(req.url).searchParams.get('data.id') ?? ''

  const parts = Object.fromEntries(
    xSignature.split(',').map(p => p.split('=').map(s => s.trim()) as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
}

function fmtMonto(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verifySignature(req, rawBody)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { type, data } = body
  if (type !== 'payment' || !data?.id) {
    return NextResponse.json({ ok: true })
  }

  // Obtener el pago completo desde la API de MP
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
  const paymentClient = new Payment(mpClient)

  let payment: Awaited<ReturnType<typeof paymentClient.get>>
  try {
    payment = await paymentClient.get({ id: String(data.id) })
  } catch (err: any) {
    console.error('[webhooks/mercadopago] Error obteniendo pago:', err)
    return NextResponse.json({ error: 'Error consultando pago' }, { status: 500 })
  }

  const status: string = payment.status ?? ''
  const statusDetail: string = payment.status_detail ?? ''
  const externalRef: string = payment.external_reference ?? ''

  // external_reference = "tenantId|planSlug"
  const [tenantId, planSlug] = externalRef.split('|')
  if (!tenantId || !planSlug) {
    console.warn('[webhooks/mercadopago] external_reference inválido:', externalRef)
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  // Buscar plan
  const { data: plan } = await admin
    .from('planes')
    .select('id, slug, nombre')
    .eq('slug', planSlug)
    .single()

  // Usuario admin del tenant
  const { data: adminUser } = await admin
    .from('usuarios')
    .select('id, nombre, email')
    .eq('tenant_id', tenantId)
    .eq('rol', 'admin')
    .limit(1)
    .single()

  const monto: number = Number(payment.transaction_amount ?? 0)
  const metodoPago: string = payment.payment_type_id === 'credit_card'
    ? `Tarjeta terminada en ${(payment as any).card?.last_four_digits ?? '****'}`
    : payment.payment_type_id ?? 'otro'
  const planNombre: string = plan?.nombre ?? planSlug

  // ── Pago aprobado ──
  if (status === 'approved') {
    const dateApproved = (payment.date_approved as string | undefined) ?? new Date().toISOString()
    const periodoInicio = new Date(dateApproved)
    const fechaVencimiento = new Date(periodoInicio)
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    // Obtener plan_ends_at actual para extender si ya tiene tiempo
    const { data: currentTenant } = await admin
      .from('tenants')
      .select('plan_ends_at')
      .eq('id', tenantId)
      .single()

    const now = new Date()
    const currentEndsAt = currentTenant?.plan_ends_at ? new Date(currentTenant.plan_ends_at) : null
    const baseDate = currentEndsAt && currentEndsAt > now ? currentEndsAt : periodoInicio
    const nuevaFecha = new Date(baseDate)
    nuevaFecha.setDate(nuevaFecha.getDate() + 30)

    await Promise.all([
      // Actualizar suscripcion pendiente → activa (por preference_id si existe, si no insertar)
      admin.from('suscripciones')
        .update({
          mp_payment_id: String(payment.id),
          mp_status: status,
          estado: 'activa',
          fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
          periodo_inicio: periodoInicio.toISOString().split('T')[0],
          ...(plan?.id ? { plan_id: plan.id } : {}),
        })
        .eq('tenant_id', tenantId)
        .eq('mp_preference_id', (payment as any).preference_id ?? '')
        .eq('estado', 'pendiente'),

      // Actualizar tenant
      admin.from('tenants')
        .update({
          plan: planSlug,
          plan_ends_at: nuevaFecha.toISOString(),
          ...(plan?.id ? { plan_id: plan.id } : {}),
        })
        .eq('id', tenantId),
    ])

    // Email recibo
    if (adminUser?.email) {
      try {
        const fechaPago = fmtFecha(dateApproved)
        const proximaFecha = fmtFecha(nuevaFecha.toISOString())
        const html = getReciboPagoEmail({
          nombre: adminUser.nombre || adminUser.email.split('@')[0],
          comprobante_id: String(payment.id),
          plan_nombre: planNombre,
          periodo: `${fechaPago} — ${proximaFecha}`,
          metodo_pago: metodoPago,
          fecha_pago: fechaPago,
          monto,
          proxima_fecha: proximaFecha,
        })
        await sendEmail(adminUser.email, `Recibo de pago — ${fmtMonto(monto)}`, html)
      } catch (err) {
        console.error('[webhooks/mercadopago] Error enviando recibo:', err)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // ── Pago rechazado / cancelado ──
  if (status === 'rejected' || status === 'cancelled') {
    await admin.from('suscripciones')
      .update({ mp_payment_id: String(payment.id), mp_status: status, estado: 'suspendida' })
      .eq('tenant_id', tenantId)
      .eq('mp_preference_id', (payment as any).preference_id ?? '')
      .eq('estado', 'pendiente')

    if (adminUser?.email) {
      try {
        const motivoFallo = MOTIVO_FALLO[statusDetail] ?? 'El pago no pudo procesarse'
        const html = getPagoFallidoEmail({
          nombre: adminUser.nombre || adminUser.email.split('@')[0],
          plan_nombre: planNombre,
          monto,
          metodo_pago: metodoPago,
          motivo_fallo: motivoFallo,
          dias_gracia: 7,
        })
        await sendEmail(adminUser.email, 'Hubo un problema con tu pago — Nube Gestión', html)
      } catch (err) {
        console.error('[webhooks/mercadopago] Error enviando email fallo:', err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
