import { NextRequest, NextResponse } from 'next/server'
import { getTransfer } from '../../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../../supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const transfer = await getTransfer(slug)
  if (!transfer || !transfer.completed) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const supabase = await getSupabaseServerClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!transfer.ownerId || transfer.ownerId !== user?.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // Aggregate country breakdown
  const countryMap: Record<string, number> = {}
  for (const ev of transfer.downloadEvents) {
    const c = ev.country === 'XX' ? 'Unknown' : ev.country
    countryMap[c] = (countryMap[c] ?? 0) + 1
  }
  const countries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count }))

  return NextResponse.json({
    downloadCount: transfer.downloadCount,
    downloadEvents: transfer.downloadEvents,
    countries,
  })
}
