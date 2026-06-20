import { NextResponse } from 'next/server'
import { listUserTransfers } from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const transfers = await listUserTransfers(user.id)

  return NextResponse.json(
    transfers.map(({ passwordHash, notifyEmail, notifiedAt, recipientEmails, files, ...rest }) => ({
      ...rest,
      passwordProtected: !!passwordHash,
      fileCount: files.length,
      files: files.map(({ name, size, type }) => ({ name, size, type })),
    })),
  )
}
