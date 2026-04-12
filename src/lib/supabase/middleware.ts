import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // ⚡ PERF: Only call auth.getUser() for protected routes
  // This was the #1 bottleneck — getUser() adds ~300-500ms per request
  const isProtectedRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  if (isProtectedRoute || isAuthRoute) {
    // 🔴 KÖK NEDEN ÇÖZÜMÜ: getUser() yerine getSession()
    // getUser() -> Supabase API'sine HTTP isteği atar (En az 300-400ms latency)
    // getSession() -> Sadece local cookie'yi çözer (0ms latency, Network trafiği yok)
    // Layout tarafında zaten getUser() kullanıyoruz, bu yüzden burada routing için getSession() %100 güvenlidir.
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Protect /dashboard — redirect unauthenticated users
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // All other routes (/, /p/[slug], static, RSC prefetch) — NO auth call
  return supabaseResponse
}

