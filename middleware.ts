import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuth = pathname.startsWith('/login') ||
    pathname.startsWith('/registro') ||
    pathname === '/'

  if (!user && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/registro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Chequeo de suscripción — solo para páginas del dashboard, excluyendo /suscripcion/*
  if (user && !isAuth && !pathname.startsWith('/suscripcion') && !pathname.startsWith('/api/')) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (usuario?.tenant_id) {
      const { data: suscripcion } = await supabase
        .from('suscripciones')
        .select('fecha_vencimiento')
        .eq('tenant_id', usuario.tenant_id)
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .maybeSingle()

      const vencida = !suscripcion || (() => {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const venc = new Date(suscripcion.fecha_vencimiento + 'T00:00:00')
        venc.setHours(0, 0, 0, 0)
        return venc < hoy
      })()

      if (vencida) {
        return NextResponse.redirect(new URL('/suscripcion', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
