import { NextRequest, NextResponse } from 'next/server'
import {
  sweepExpiredTransfers,
  getTransfer,
  markNotificationSent,
} from '../../../../lib/transfer'
import { getRedisClient } from '../../../../redisClient'
import { sendMail } from '../../../../email'
import { tplTransferReady } from '../../../../emailTemplates'
import { brand } from '../../../../brand'

export const dynamic = 'force-dynamic'

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

// Called by VPS cron every 5 minutes.
// 1. Sweeps expired/burned R2 objects.
// 2. Dispatches recipient emails for scheduled transfers whose sendAt has passed.
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

  // Sweep expired transfers
  let deleted = 0
  for (let i = 0; i < 5; i++) {
    const n = await sweepExpiredTransfers(100)
    deleted += n
    if (n < 100) break
  }

  // Dispatch scheduled transfer emails
  let dispatched = 0
  try {
    const redis = getRedisClient()
    // scheduled transfers are stored in a sorted set keyed by sendAt timestamp
    const now = Date.now()
    const pending = await redis.zrangebyscore(
      'transfer:scheduled',
      '-inf',
      now,
      'LIMIT',
      0,
      20,
    )

    for (const slug of pending) {
      const t = await getTransfer(slug)
      if (!t || t.notificationSent) {
        await redis.zrem('transfer:scheduled', slug)
        continue
      }
      if (!t.scheduledAt || new Date(t.scheduledAt).getTime() > now) continue

      const baseUrl = `${brand.url}/transfer/${t.slug}`
      for (const to of t.recipientEmails) {
        // find token for this email
        const token = Object.entries(t.recipientTokens ?? {}).find(
          ([, v]) => v.email === to,
        )?.[0]
        const url = token ? `${baseUrl}?rt=${token}` : baseUrl
        const tpl = tplTransferReady({
          title: t.title,
          url,
          senderMessage: t.message,
          fileCount: t.files.length,
          totalSize: formatBytes(t.totalSize),
          expiresAt: t.expiresAt,
          senderName: t.senderName || undefined,
        })
        void sendMail({
          to,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        })
      }

      await markNotificationSent(slug)
      await redis.zrem('transfer:scheduled', slug)
      dispatched++
    }
  } catch (e) {
    console.error('[cron/cleanup] scheduled dispatch error:', e)
  }

  return NextResponse.json({
    ok: true,
    deleted,
    dispatched,
    ts: new Date().toISOString(),
  })
}
