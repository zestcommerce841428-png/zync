import 'server-only'
import { createHash } from 'crypto'
import { getRedisClient } from '../redisClient'

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
  const ttl = Math.ceil(
    (new Date(record.expiresAt).getTime() - Date.now()) / 1000,
  )
  if (ttl <= 0) return
  await redis.set(KEY(record.slug), JSON.stringify(record), 'EX', ttl)
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
  // Keep the sorted set alive 31 days beyond the longest possible transfer
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
  // Get all slugs whose expiry score is in the future
  const slugs = await redis.zrangebyscore(
    USER_KEY(ownerId),
    Date.now(),
    '+inf',
  )
  if (slugs.length === 0) return []
  const records = await Promise.all(slugs.map(getTransfer))
  // Filter nulls (Redis key expired but sorted set member lingered)
  const valid = records.filter((r): r is TransferRecord => r !== null && r.completed)
  // Clean up expired members from the sorted set
  await redis.zremrangebyscore(USER_KEY(ownerId), '-inf', Date.now() - 1)
  return valid.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
