import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  })

  const payment = await mpRes.json()

  if (payment.status === 'approved') {
    try {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('tenant_id')
          .eq('id', user.id)
          .single()

        if (usuario?.tenant_id) {
          const nuevaFecha = new Date()
          nuevaFecha.setDate(nuevaFecha.getDate() + 30)

          const plan = body.metadata?.plan || 'pro'

          await Promise.all([
            supabase.from('suscripciones').insert({
              tenant_id: usuario.tenant_id,
              fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
              monto: body.transaction_amount,
              mp_payment_id: String(payment.id),
              mp_status: payment.status,
            }),
            supabase
              .from('tenants')
              .update({
                plan,
                plan_ends_at: nuevaFecha.toISOString(),
                plan_choice_made: false,
              })
              .eq('id', usuario.tenant_id),
          ])
        }
      }
    } catch (e) {
      console.error('Error guardando suscripcion:', e)
    }

    return NextResponse.json({ redirect: '/suscripcion/aprobado' })
  }

  if (payment.status === 'pending' || payment.status === 'in_process') {
    return NextResponse.json({
      redirect: `/suscripcion/pendiente?status_detail=${encodeURIComponent(payment.status_detail || '')}&method=${encodeURIComponent(payment.payment_method_id || '')}`,
    })
  }

  // Errores de validación de MP (token inválido, campos vacíos, etc.)
  if (payment.cause && Array.isArray(payment.cause)) {
    return NextResponse.json({ causes: payment.cause }, { status: 422 })
  }

  return NextResponse.json({
    redirect: `/suscripcion/rechazado?status_detail=${encodeURIComponent(payment.status_detail || '')}&method=${encodeURIComponent(payment.payment_method_id || '')}&amount=${encodeURIComponent(payment.transaction_amount || '')}`,
  })
}
