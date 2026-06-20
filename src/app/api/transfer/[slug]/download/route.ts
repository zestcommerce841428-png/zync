import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '../../../../../lib/r2'
import { getTransfer, updateTransfer, hashPassword, sweepExpiredTransfers } from '../../../../../lib/transfer'
import { sendMail } from '../../../../../email'
import { tplTransferDownloaded } from '../../../../../emailTemplates'
import { brand } from '../../../../../brand'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  fileIndex: z.number().int().nonnegative(),
  password: z.string().optional(),
  preview: z.boolean().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  void sweepExpiredTransfers()
  const transfer = await getTransfer(slug)
  if (!transfer || !transfer.completed)
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (new Date(transfer.expiresAt) < new Date())
    return NextResponse.json({ error: 'Transfer has expired.' }, { status: 410 })

  if (
    transfer.maxDownloads !== null &&
    transfer.downloadCount >= transfer.maxDownloads
  )
    return NextResponse.json({ error: 'Download limit reached.' }, { status: 410 })

  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  // Password check
  if (transfer.passwordHash) {
    const supplied = body.data.password
    if (!supplied || hashPassword(supplied) !== transfer.passwordHash)
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 })
  }

  const file = transfer.files[body.data.fileIndex]
  if (!file)
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  const r2 = getR2Client()
  const isPreview = body.data.preview
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.key,
      // For preview, serve inline; for download, force attachment
      ...(isPreview
        ? { ResponseContentType: file.type || 'application/octet-stream' }
        : { ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"` }),
    }),
    { expiresIn: isPreview ? 300 : 900 },
  )

  // Increment download count only on first file of each batch (not for previews)
  if (!isPreview && body.data.fileIndex === 0) {
    const newCount = transfer.downloadCount + 1
    await updateTransfer(slug, { downloadCount: newCount })

    // Notify sender on first ever download
    if (transfer.notifyEmail && !transfer.notifiedAt) {
      void updateTransfer(slug, { notifiedAt: new Date().toISOString() })
      const tpl = tplTransferDownloaded({
        title: transfer.title,
        url: `${brand.url}/transfer/${slug}`,
        downloadCount: newCount,
      })
      void sendMail({
        to: transfer.notifyEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })
    }
  }

  return NextResponse.json({ url, name: file.name, size: file.size })
}
