import { NextRequest, NextResponse } from 'next/server'
import { sweepExpiredTransfers } from '../../../../lib/transfer'

export const dynamic = 'force-dynamic'

// Called by a VPS cron every 5 minutes. Deletes R2 objects for expired/burned
// transfers in batches of 100. Protected by a shared secret so only the cron
// runner can trigger it — not the public internet.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured.' },
      { status: 503 },
    )
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Run multiple sweeps to drain larger backlogs quickly
  let deleted = 0
  for (let i = 0; i < 5; i++) {
    const n = await sweepExpiredTransfers(100)
    deleted += n
    if (n < 100) break
  }

  return NextResponse.json({ ok: true, deleted, ts: new Date().toISOString() })
}
