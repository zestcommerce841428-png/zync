import { type NextRequest, NextResponse } from 'next/server'
import { getTransfer, updateTransfer } from '../../../../lib/transfer'
import { getStorageClient, getStorageBucket } from '../../../../lib/storage'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  dequeueScanBatch,
  submitUrlToVirusTotal,
  getVirusTotalResult,
} from '../../../../lib/virusScan'
import { getSetting, isFeatureEnabled } from '../../../../lib/appSettings'
import { sendMail } from '../../../../email'
import { brand } from '../../../../brand'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret)
    return NextResponse.json(
      { error: 'CRON_SECRET not configured.' },
      { status: 503 },
    )

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const enabled = await isFeatureEnabled('feature_virus_scan', false)
  if (!enabled)
    return NextResponse.json({ ok: true, skipped: 'feature_disabled' })

  const apiKey = await getSetting('virustotal_api_key')
  if (!apiKey) return NextResponse.json({ ok: true, skipped: 'no_api_key' })

  // Process pending scans
  const slugs = await dequeueScanBatch(5)
  let scanned = 0

  for (const slug of slugs) {
    try {
      const t = await getTransfer(slug)
      if (!t || !t.completed) continue

      if (t.scanStatus === 'scanning' && t.scanAnalysisId) {
        // Poll existing analysis
        const result = await getVirusTotalResult(apiKey, t.scanAnalysisId)
        if (result.status === 'completed') {
          const status = result.malicious > 0 ? 'infected' : 'clean'
          await updateTransfer(slug, {
            scanStatus: status,
            scanAnalysisId: null,
          })
          if (status === 'infected' && t.notifyEmail) {
            void sendMail({
              to: t.notifyEmail,
              subject: `⚠️ Malware detected in your transfer — ${brand.name}`,
              html: `<p>Our virus scanner detected malicious content in your transfer${t.title ? ` <strong>${t.title}</strong>` : ''}.</p><p>The transfer has been flagged and download access has been suspended. Please review and delete this transfer.</p><p><a href="${brand.url}/transfer/${slug}">View transfer</a></p>`,
              text: `Malware detected in your transfer${t.title ? ` "${t.title}"` : ''}. Access suspended. View: ${brand.url}/transfer/${slug}`,
            })
          }
          scanned++
        } else {
          // Still in progress — re-queue for next cron run
          const { getRedisClient } = await import('../../../../redisClient')
          await getRedisClient().lpush('scan:queue', slug)
        }
        continue
      }

      // First scan: get presigned URL for first file
      if (t.files.length === 0) {
        await updateTransfer(slug, { scanStatus: 'skipped' })
        continue
      }

      const storage = await getStorageClient()
      const bucket = await getStorageBucket()
      const file = t.files[0]
      const url = await getSignedUrl(
        storage,
        new GetObjectCommand({ Bucket: bucket, Key: file.key }),
        { expiresIn: 300 },
      )

      await updateTransfer(slug, { scanStatus: 'scanning' })
      const analysisId = await submitUrlToVirusTotal(apiKey, url, file.name)

      if (!analysisId) {
        await updateTransfer(slug, { scanStatus: 'error' })
      } else if (analysisId.startsWith('skipped:')) {
        await updateTransfer(slug, { scanStatus: 'skipped' })
      } else {
        await updateTransfer(slug, {
          scanStatus: 'scanning',
          scanAnalysisId: analysisId,
        })
        // Re-queue to poll result on next run
        const { getRedisClient } = await import('../../../../redisClient')
        await getRedisClient().lpush('scan:queue', slug)
      }
      scanned++
    } catch (e) {
      console.error(`[cron/scan] error scanning ${slug}:`, e)
    }
  }

  return NextResponse.json({ ok: true, scanned })
}
