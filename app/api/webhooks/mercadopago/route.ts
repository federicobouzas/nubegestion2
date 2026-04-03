import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getReciboPagoEmail, getPagoFallidoEmail } from '@/emails'

// Mapeo de status_detail de MP a texto legible
const MOTIVO_FALLO: Record<string, string> = {
  cc_rejected_insufficient_amount:  'Fondos insuficientes en la tarjeta',
  cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
  cc_rejected_bad_filled_date:       'Fecha de vencimiento incorrecta',
  cc_rejected_bad_filled_other:      'Datos de la tarjeta incorrectos',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_blacklist:             'Tarjeta bloqueada por el banco emisor',
  cc_rejected_call_for_authorize:    'El banco requiere autorización previa',
  cc_rejected_card_disabled:         'Tarjeta deshabilitada',
  cc_rejected_card_error:            'Error en la tarjeta',
  cc_rejected_duplicated_payment:    'Pago duplicado detectado',
  cc_rejected_high_risk:             'Rechazado por riesgo de seguridad',
  cc_rejected_max_attempts:          'Límite de intentos alcanzado',
  cc_rejected_other_reason:          'Rechazado por el banco',
  rejected_by_bank:                  'Rechazado por el banco',
  rejected_insufficient_data:        'Datos insuficientes',
  by_admin:                          'Cancelado por el administrador',
  expired:                           'Pago expirado',
}

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const dataId = new URL(req.url).searchParams.get('data.id') ?? ''

  // MP firma con: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
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
    return NextResponse.json({ ok: true }) // otros eventos no nos interesan
  }

  // Buscar el pago en MP (en producción se haría fetch a la API de MP)
  // Acá asumimos que el body ya trae los datos del pago en body.data
  const payment = body.data
  const status: string = payment.status ?? ''
  const statusDetail: string = payment.status_detail ?? ''

  const admin = createAdminClient()

  // Identificar el tenant via external_reference (tenant_id)
  const tenantId: string = payment.external_reference ?? ''
  if (!tenantId) {
    console.warn('[webhooks/mercadopago] Sin external_reference en el pago')
    return NextResponse.json({ ok: true })
  }

  const { data: adminUser } = await admin
    .from('usuarios')
    .select('id, nombre, email')
    .eq('tenant_id', tenantId)
    .eq('rol', 'admin')
    .limit(1)
    .single()

  if (!adminUser?.email) {
    return NextResponse.json({ ok: true })
  }

  const nombre = adminUser.nombre || adminUser.email.split('@')[0]
  const planNombre: string = payment.description ?? 'Plan'
  const monto: number = Number(payment.transaction_amount ?? 0)
  const metodoPago: string = payment.payment_type_id === 'credit_card'
    ? `Tarjeta terminada en ${payment.card?.last_four_digits ?? '****'}`
    : payment.payment_type_id ?? 'otro'

  try {
    if (status === 'approved') {
      const fechaPago = fmtFecha(payment.date_approved ?? payment.date_created ?? new Date().toISOString())
      const proximaFecha = (() => {
        const d = new Date(payment.date_approved ?? payment.date_created ?? new Date().toISOString())
        d.setMonth(d.getMonth() + 1)
        return fmtFecha(d.toISOString())
      })()

      const html = getReciboPagoEmail({
        nombre,
        comprobante_id: String(payment.id ?? data.id),
        plan_nombre: planNombre,
        periodo: `${fmtFecha(payment.date_created ?? new Date().toISOString())} — ${proximaFecha}`,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago,
        monto,
        proxima_fecha: proximaFecha,
      })
      await sendEmail(adminUser.email, `Recibo de pago — ${fmtMonto(monto)}`, html)

    } else if (status === 'rejected' || status === 'cancelled') {
      const motivoFallo = MOTIVO_FALLO[statusDetail] ?? 'El pago no pudo procesarse'

      const html = getPagoFallidoEmail({
        nombre,
        plan_nombre: planNombre,
        monto,
        metodo_pago: metodoPago,
        motivo_fallo: motivoFallo,
        dias_gracia: 7,
      })
      await sendEmail(adminUser.email, 'Hubo un problema con tu pago — Nube Gestión', html)
    }
  } catch (err: any) {
    console.error('[webhooks/mercadopago] Error enviando email:', err)
  }

  return NextResponse.json({ ok: true })
}
