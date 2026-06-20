import 'server-only'
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
  expiresAt: string      // ISO
  maxDownloads: number | null
  downloadCount: number
  message: string
  createdAt: string
  completed: boolean
}

const KEY = (slug: string) => `transfer:${slug}`

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

export function expiryDate(loggedIn: boolean): string {
  const days = loggedIn ? 30 : 7
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
