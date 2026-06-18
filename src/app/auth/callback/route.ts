import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../supabase/server'

// OAuth callback — exchanges the auth code for a session cookie, then redirects.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/account'

  // Behind a reverse proxy (nginx/Docker), request.nextUrl.origin is the
  // INTERNAL container origin (e.g. http://<container-id>:3000). Prefer the
  // configured public site URL, then the forwarded headers, so redirects point
  // at the real domain — not an unreachable internal host.
  const fwdHost = request.headers.get('x-forwarded-host')
  const fwdProto = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (fwdHost ? `${fwdProto}://${fwdHost}` : origin)

  if (code) {
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${baseUrl}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`)
}
