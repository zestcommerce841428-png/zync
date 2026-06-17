import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../../../supabase/server'
import { getSupabaseAdminClient } from '../../../../supabase/admin'

// Permanently deletes the signed-in user's account. Requires the service-role
// key (server-only). The user must be authenticated; they can only delete
// themselves.
export async function POST(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured.' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'Account deletion is not enabled (missing service role key).' },
      { status: 503 },
    )
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Clear the local session.
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
