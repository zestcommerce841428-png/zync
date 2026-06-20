import 'server-only'
import { createHash } from 'crypto'
import { getRedisClient } from '../redisClient'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET } from './r2'

export type TransferFile = {
  key: string   // R2 object key
  name: string
  size: number
  type: string
}

export type TransferRecord = {
  slug: string
  ownerId: string | null
  files: TransferFile[]
  totalSize: number
  expiresAt: string          // ISO
  expiryDays: number         // chosen expiry (1, 3, 7, 14, 30)
  maxDownloads: number | null
  downloadCount: number
  title: string              // optional title
  message: string
  passwordHash: string | null // SHA-256 hex
  notifyEmail: string | null  // sender email — notified on first download
  notifiedAt: string | null   // ISO, set after notification sent
  recipientEmails: string[]   // emails to send link to on complete
  createdAt: string
  completed: boolean
}

const KEY = (slug: string) => `transfer:${slug}`
const USER_KEY = (ownerId: string) => `transfer:user:${ownerId}`
// Cleanup queue: sorted set of {slug, keys} JSON values scored by expiresAt ms
const CLEANUP_KEY = 'transfer:cleanup'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function expiryDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function defaultExpiryDays(loggedIn: boolean): number {
  return loggedIn ? 30 : 7
}

export async function saveTransfer(record: TransferRecord): Promise<void> {
  const redis = getRedisClient()
  const expiresMs = new Date(record.expiresAt).getTime()
  const ttl = Math.ceil((expiresMs - Date.now()) / 1000)
  if (ttl <= 0) return
  await redis.set(KEY(record.slug), JSON.stringify(record), 'EX', ttl)
  // Register R2 keys in cleanup queue so they're deleted exactly at expiry
  const entry = JSON.stringify({ slug: record.slug, keys: record.files.map((f) => f.key) })
  await redis.zadd(CLEANUP_KEY, expiresMs, entry)
  // Keep the cleanup queue alive for 32 days (longer than max expiry)
  await redis.expire(CLEANUP_KEY, 32 * 24 * 3600)
}

export async function getTransfer(slug: string): Promise<TransferRecord | null> {
  const redis = getRedisClient()
  const raw = await redis.get(KEY(slug))
  if (!raw) return null
  try {
    return JSON.parse(raw) as TransferRecord
  } catch {
    return null
  }
}

export async function updateTransfer(
  slug: string,
  patch: Partial<TransferRecord>,
): Promise<void> {
  const redis = getRedisClient()
  const existing = await getTransfer(slug)
  if (!existing) return
  const updated = { ...existing, ...patch }
  const ttl = Math.ceil(
    (new Date(updated.expiresAt).getTime() - Date.now()) / 1000,
  )
  if (ttl <= 0) return
  await redis.set(KEY(slug), JSON.stringify(updated), 'EX', ttl)
}

export async function deleteTransfer(slug: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(KEY(slug))
  // Remove all cleanup-queue entries for this slug (match by slug prefix)
  await purgeCleanupEntries(slug)
}

// Remove cleanup-queue entries whose slug matches (used on manual delete)
async function purgeCleanupEntries(slug: string): Promise<void> {
  const redis = getRedisClient()
  // Scan all entries and remove those matching the slug
  const all = await redis.zrange(CLEANUP_KEY, 0, -1)
  const toRemove = all.filter((entry) => {
    try { return JSON.parse(entry).slug === slug } catch { return false }
  })
  if (toRemove.length > 0) {
    await redis.zrem(CLEANUP_KEY, ...toRemove)
  }
}

// ── Cleanup sweep — call this on any API route to delete expired R2 objects ──
// Processes up to `limit` expired entries per call (keeps each request fast)

export async function sweepExpiredTransfers(limit = 20): Promise<void> {
  const redis = getRedisClient()
  const now = Date.now()
  // Get entries whose score (expiresAt ms) has passed
  const expired = await redis.zrangebyscore(CLEANUP_KEY, '-inf', now, 'LIMIT', 0, limit)
  if (expired.length === 0) return

  const r2Keys: string[] = []
  const entries: string[] = []

  for (const entry of expired) {
    entries.push(entry)
    try {
      const { keys } = JSON.parse(entry) as { slug: string; keys: string[] }
      r2Keys.push(...keys)
    } catch {}
  }

  // Delete R2 objects in one batch call (max 1000 per S3 request)
  if (r2Keys.length > 0) {
    try {
      const r2 = getR2Client()
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: r2Keys.map((Key) => ({ Key })), Quiet: true },
        }),
      )
    } catch {
      // best-effort — lifecycle rule is a safety net
    }
  }

  // Remove processed entries from the queue
  await redis.zrem(CLEANUP_KEY, ...entries)
}

// ── User transfer index (sorted set: score = expiresAt ms) ──────────────────

export async function addUserTransferIndex(
  ownerId: string,
  slug: string,
  expiresAt: string,
): Promise<void> {
  const redis = getRedisClient()
  const score = new Date(expiresAt).getTime()
  await redis.zadd(USER_KEY(ownerId), score, slug)
  await redis.expire(USER_KEY(ownerId), 31 * 24 * 3600)
}

export async function removeUserTransferIndex(
  ownerId: string,
  slug: string,
): Promise<void> {
  const redis = getRedisClient()
  await redis.zrem(USER_KEY(ownerId), slug)
}

export async function listUserTransfers(ownerId: string): Promise<TransferRecord[]> {
  const redis = getRedisClient()
  const slugs = await redis.zrangebyscore(USER_KEY(ownerId), Date.now(), '+inf')
  if (slugs.length === 0) return []
  const records = await Promise.all(slugs.map(getTransfer))
  const valid = records.filter((r): r is TransferRecord => r !== null && r.completed)
  await redis.zremrangebyscore(USER_KEY(ownerId), '-inf', Date.now() - 1)
  return valid.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
