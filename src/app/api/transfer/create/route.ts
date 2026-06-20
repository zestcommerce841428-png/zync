import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '../../../../lib/r2'
import {
  saveTransfer,
  expiryDate,
  defaultExpiryDays,
  hashPassword,
  addUserTransferIndex,
  sweepExpiredTransfers,
} from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'
import { generateShortSlug } from '../../../../slugs'
import { rateLimit, getClientIp } from '../../../../rateLimit'
import { tooManyRequests, ok, err } from '../../../../lib/apiResponse'

export const dynamic = 'force-dynamic'

const MAX_BYTES = Number(process.env.NEXT_PUBLIC_TRANSFER_MAX_BYTES ?? 2 * 1024 * 1024 * 1024)
const MAX_FILES = 20

const FileSchema = z.object({
  name: z.string().min(1).max(500),
  size: z.number().int().nonnegative(),
  type: z.string().max(200),
})

const BodySchema = z.object({
  files: z.array(FileSchema).min(1).max(MAX_FILES),
  title: z.string().max(200).default(''),
  message: z.string().max(1000).default(''),
  password: z.string().max(200).optional(),
  expiryDays: z.number().int().min(1).max(30).optional(),
  maxDownloads: z.number().int().positive().nullable().default(null),
  notifyEmail: z.string().email().optional().or(z.literal('')),
  recipientEmails: z.array(z.string().email()).max(20).default([]),
  burnAfterRead: z.boolean().default(false),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 10 transfer creations per 10 min per IP (generous for legit users, blocks bulk abuse)
  const ip = getClientIp(req)
  const rl = await rateLimit(`transfer-create:${ip}`, { limit: 10, windowSeconds: 600 })
  if (!rl.success) return tooManyRequests(rl)

  if (!process.env.R2_ACCOUNT_ID) {
    return err('Cloud transfers are not configured on this server.', { status: 503 })
  }

  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) return err('Invalid payload.')

  const { files, title, message, password, maxDownloads, notifyEmail, recipientEmails, burnAfterRead } =
    body.data
  const totalSize = files.reduce((s, f) => s + f.size, 0)
  if (totalSize > MAX_BYTES) return err('Total size exceeds 2 GB limit.')

  try {
    const supabase = await getSupabaseServerClient()
    const user = supabase ? (await supabase.auth.getUser()).data.user : null
    const ownerId = user?.id ?? null

    const days = body.data.expiryDays ?? defaultExpiryDays(!!ownerId)
    const maxDays = ownerId ? 30 : 7
    const expiryDays = Math.min(days, maxDays)

    const slug = await generateShortSlug()
    const r2 = getR2Client()

    void sweepExpiredTransfers()

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

    const expires = expiryDate(expiryDays)

    await saveTransfer({
      slug,
      ownerId,
      files: fileRecords,
      totalSize,
      expiresAt: expires,
      expiryDays,
      maxDownloads,
      downloadCount: 0,
      title,
      message,
      passwordHash: password ? hashPassword(password) : null,
      notifyEmail: notifyEmail || null,
      notifiedAt: null,
      recipientEmails,
      burnAfterRead,
      createdAt: new Date().toISOString(),
      completed: false,
    })

    if (ownerId) {
      await addUserTransferIndex(ownerId, slug, expires)
    }

    return ok({ slug, uploadUrls, expiresAt: expires }, { status: 201, rl })
  } catch (e) {
    console.error('[transfer/create]', e)
    return err('Failed to create transfer. Please try again.', { status: 500 })
  }
}
