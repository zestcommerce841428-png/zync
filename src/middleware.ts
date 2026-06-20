import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require a logged-in Supabase user
const PROTECTED_PATHS = ['/transfer', '/account', '/profile']

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, host } = request.nextUrl

  // ── 1. Canonical redirect: www → non-www ───────────────────────────────────
  if (host.startsWith('www.')) {
    const canonical = new URL(request.url)
    canonical.host = host.replace(/^www\./, '')
    return NextResponse.redirect(canonical, { status: 301 })
  }

  // ── 2. Auth guard for protected routes ─────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  // Generate a unique request ID for tracing (visible in response headers, useful for support)
  const requestId = crypto.randomUUID()

  let response: NextResponse

  if (isProtected) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      response = NextResponse.next()
    } else {
      response = NextResponse.next()

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            )
          },
        },
      })

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        response = NextResponse.redirect(loginUrl)
      }
    }
  } else {
    response = NextResponse.next()
  }

  // ── 3. Security response headers (belt-and-suspenders over next.config.js) ─
  response.headers.set('X-Request-ID', requestId)

  // Remove server fingerprinting headers if proxied through nginx-proxy
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|map)).*)',
  ],
}
