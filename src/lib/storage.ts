import 'server-only'
import { S3Client } from '@aws-sdk/client-s3'

export type StorageProvider = 'r2' | 's3'

let _client: S3Client | null = null
let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider | null {
  if (process.env.R2_ACCOUNT_ID) return 'r2'
  if (process.env.AWS_ACCESS_KEY_ID) return 's3'
  return null
}

export function isStorageConfigured(): boolean {
  return getStorageProvider() !== null
}

export function getStorageClient(): S3Client {
  const provider = getStorageProvider()
  if (!provider) throw new Error('No storage provider configured. Set R2_ACCOUNT_ID or AWS_ACCESS_KEY_ID.')

  if (_client && _provider === provider) return _client

  _provider = provider
  if (provider === 'r2') {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })
  } else {
    _client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    })
  }
  return _client
}

export function getStorageBucket(): string {
  const provider = getStorageProvider()
  if (provider === 'r2') return process.env.R2_BUCKET_NAME ?? 'zync-transfers'
  return process.env.AWS_S3_BUCKET ?? 'zync-transfers'
}

// S3 Intelligent-Tiering reduces cost for infrequently accessed objects.
// R2 has no storage classes — returns undefined.
export function getStorageClass(): 'INTELLIGENT_TIERING' | undefined {
  return getStorageProvider() === 's3' ? 'INTELLIGENT_TIERING' : undefined
}
