import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { sendEmail } from '@/lib/email'
import { getConfirmacionEmailEmail, getRecuperoPasswordEmail } from '@/emails'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const signature = req.headers.get('x-supabase-signature')
  const hmac = createHmac('sha256', process.env.SUPABASE_HOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  if (signature !== hmac) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const type: string = body.type ?? ''
  const email: string = body.user?.email ?? ''
  const nombre: string = body.user?.user_metadata?.nombre || email.split('@')[0]
  const tokenHash: string = body.email_data?.token_hash ?? ''

  if (!email || !tokenHash || !['confirm', 'reset'].includes(type)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const tokenUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token_hash=${tokenHash}&type=${type}`

  try {
    if (type === 'confirm') {
      const html = getConfirmacionEmailEmail({ nombre, confirmation_url: tokenUrl })
      await sendEmail(email, 'Confirmá tu email — Nube Gestión', html)
    } else {
      const html = getRecuperoPasswordEmail({ nombre, reset_url: tokenUrl })
      await sendEmail(email, 'Recuperá tu contraseña — Nube Gestión', html)
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[api/auth/send-email] Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Error enviando email' }, { status: 500 })
  }
}
