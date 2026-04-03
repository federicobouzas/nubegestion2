import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email'
import { getBienvenidaEmail } from '@/emails'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const nombre = (user.user_metadata?.nombre as string | undefined) || user.email?.split('@')[0] || 'Usuario'
      const email = user.email ?? ''

      // Enviar email de bienvenida (solo en confirmaciones nuevas)
      if (email) {
        try {
          const html = getBienvenidaEmail({ nombre, email })
          await sendEmail(email, '¡Bienvenido a Nube Gestión!', html)
        } catch (err) {
          console.error('[auth/callback] Error enviando email de bienvenida:', err)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
