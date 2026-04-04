import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
    pathname.startsWith('/recuperar-contrasena') ||
    pathname.startsWith('/nueva-contrasena') ||
    pathname === '/'

  if (!user && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/registro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Chequeo de plan — solo para páginas del dashboard, excluyendo /suscripcion/* y /api/*
  if (user && !isAuth && !pathname.startsWith('/suscripcion') && !pathname.startsWith('/api/')) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (usuario?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan, plan_ends_at')
        .eq('id', usuario.tenant_id)
        .single()

      const plan = tenant?.plan ?? 'free'

      // Free nunca redirige
      if (plan !== 'free' && tenant?.plan_ends_at) {
        const now = new Date()
        const endsAt = new Date(tenant.plan_ends_at)
        const diasVencido = Math.floor((now.getTime() - endsAt.getTime()) / (1000 * 60 * 60 * 24))

        if (diasVencido > 7) {
          return NextResponse.redirect(new URL('/suscripcion', request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}