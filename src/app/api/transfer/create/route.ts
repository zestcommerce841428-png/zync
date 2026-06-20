import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '../../../../lib/r2'
import { saveTransfer, expiryDate } from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'
import { generateShortSlug } from '../../../../slugs'

export const dynamic = 'force-dynamic'

const MAX_BYTES = Number(process.env.NEXT_PUBLIC_TRANSFER_MAX_BYTES ?? 2 * 1024 * 1024 * 1024)
const MAX_FILES = 10

const FileSchema = z.object({
  name: z.string().min(1).max(500),
  size: z.number().int().nonnegative(),
  type: z.string().max(200),
})

const BodySchema = z.object({
  files: z.array(FileSchema).min(1).max(MAX_FILES),
  message: z.string().max(500).default(''),
  maxDownloads: z.number().int().positive().nullable().default(null),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  const { files, message, maxDownloads } = body.data
  const totalSize = files.reduce((s, f) => s + f.size, 0)
  if (totalSize > MAX_BYTES)
    return NextResponse.json({ error: 'Total size exceeds 2 GB limit.' }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null
  const ownerId = user?.id ?? null

  const slug = await generateShortSlug()
  const r2 = getR2Client()

  // Generate one presigned PUT URL per file
  const uploadUrls: string[] = []
  const fileRecords: Array<{ key: string; name: string; size: number; type: string }> = []

  for (const f of files) {
    const key = `${slug}/${crypto.randomUUID()}_${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: f.type || 'application/octet-stream',
      ContentLength: f.size,
    })
    const url = await getSignedUrl(r2, cmd, { expiresIn: 3600 })
    uploadUrls.push(url)
    fileRecords.push({ key, name: f.name, size: f.size, type: f.type })
  }

  await saveTransfer({
    slug,
    ownerId,
    files: fileRecords,
    totalSize,
    expiresAt: expiryDate(!!ownerId),
    maxDownloads,
    downloadCount: 0,
    message,
    createdAt: new Date().toISOString(),
    completed: false,
  })

  return NextResponse.json({ slug, uploadUrls })
}
