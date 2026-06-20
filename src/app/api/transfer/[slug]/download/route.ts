import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '../../../../../lib/r2'
import { getTransfer, updateTransfer, hashPassword, sweepExpiredTransfers, scheduleBurn } from '../../../../../lib/transfer'
import { sendMail } from '../../../../../email'
import { tplTransferDownloaded } from '../../../../../emailTemplates'
import { brand } from '../../../../../brand'
import { rateLimit, getClientIp } from '../../../../../rateLimit'
import { tooManyRequests, notFound, gone, err, ok } from '../../../../../lib/apiResponse'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  fileIndex: z.number().int().nonnegative().max(19),
  password: z.string().max(200).optional(),
  preview: z.boolean().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params

  // Brute-force protection: 15 downloads per 5 min per IP
  const ip = getClientIp(req)
  const rl = await rateLimit(`transfer-download:${ip}`, { limit: 15, windowSeconds: 300 })
  if (!rl.success) return tooManyRequests(rl)

  void sweepExpiredTransfers()

  const transfer = await getTransfer(slug)
  if (!transfer || !transfer.completed) return notFound('Transfer not found.')

  if (new Date(transfer.expiresAt) < new Date()) return gone('Transfer has expired.')

  if (
    transfer.maxDownloads !== null &&
    transfer.downloadCount >= transfer.maxDownloads
  )
    return gone('Download limit reached.')

  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) return err('Invalid payload.')

  // Password check
  if (transfer.passwordHash) {
    const supplied = body.data.password
    if (!supplied || hashPassword(supplied) !== transfer.passwordHash)
      return err('Incorrect password.', { status: 403 })
  }

  const file = transfer.files[body.data.fileIndex]
  if (!file) return notFound('File not found.')

  const r2 = getR2Client()
  const isPreview = body.data.preview
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.key,
      ...(isPreview
        ? { ResponseContentType: file.type || 'application/octet-stream' }
        : { ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"` }),
    }),
    { expiresIn: isPreview ? 300 : 900 },
  )

  // Increment download count on first file of batch (not for previews)
  if (!isPreview && body.data.fileIndex === 0) {
    const newCount = transfer.downloadCount + 1
    await updateTransfer(slug, { downloadCount: newCount })

    // Notify sender on first ever download (fire-and-forget)
    if (transfer.notifyEmail && !transfer.notifiedAt) {
      void updateTransfer(slug, { notifiedAt: new Date().toISOString() })
      const tpl = tplTransferDownloaded({
        title: transfer.title,
        url: `${brand.url}/transfer/${slug}`,
        downloadCount: newCount,
      })
      void sendMail({ to: transfer.notifyEmail, subject: tpl.subject, html: tpl.html, text: tpl.text })
    }

    // Burn-after-read: schedule R2 deletion 30 s from now so ZIP builders
    // can still fetch all file URLs within the grace window.
    if (transfer.burnAfterRead) {
      void scheduleBurn(slug, transfer.files.map((f) => f.key))
      // Guarantee cleanup even if no further API traffic arrives
      setTimeout(() => void sweepExpiredTransfers(), 32_000)
    }
  }

  return ok({ url, name: file.name, size: file.size }, { rl })
}
