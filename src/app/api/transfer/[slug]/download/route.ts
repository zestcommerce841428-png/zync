import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '../../../../../lib/r2'
import { getTransfer, updateTransfer } from '../../../../../lib/transfer'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ fileIndex: z.number().int().nonnegative() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
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

  const file = transfer.files[body.data.fileIndex]
  if (!file)
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  const r2 = getR2Client()
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
    }),
    { expiresIn: 900 }, // 15 minutes
  )

  // Increment download count only on first file of each "batch"
  if (body.data.fileIndex === 0) {
    await updateTransfer(slug, { downloadCount: transfer.downloadCount + 1 })
  }

  return NextResponse.json({ url, name: file.name, size: file.size })
}
