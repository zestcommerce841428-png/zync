import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase/config'

// Paths that require a signed-in account (when auth is configured).
const PROTECTED = ['/send', '/stats', '/account', '/admin']

// Refreshes the Supabase auth session on navigation and gates protected tools.
// No-ops entirely when Supabase isn't configured.
// (Next.js 16 "proxy" convention — replaces the deprecated "middleware" file.)
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const needsAuth = PROTECTED.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )

  if (needsAuth && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/send/:path*', '/stats/:path*', '/account/:path*', '/admin/:path*', '/auth/:path*'],
}
