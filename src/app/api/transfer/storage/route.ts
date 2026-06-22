import { NextResponse } from 'next/server'
import { listUserTransfers } from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient()
  if (!supabase)
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const transfers = await listUserTransfers(user.id)
  const totalBytes = transfers.reduce((s, t) => s + t.totalSize, 0)
  const fileCount = transfers.reduce((s, t) => s + t.files.length, 0)
  return NextResponse.json({
    totalBytes,
    fileCount,
    transferCount: transfers.length,
  })
}
