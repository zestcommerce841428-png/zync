import 'server-only'
import { S3Client, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3'

let r2: S3Client | null = null

export function getR2Client(): S3Client {
  if (!r2) {
    const accountId = process.env.R2_ACCOUNT_ID
    if (!accountId) throw new Error('R2_ACCOUNT_ID is not set')
    r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })
  }
  return r2
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'zync-transfers'

// Set once per process — auto-delete R2 objects 35 days after upload
// (35-day buffer covers the 30-day max transfer expiry + 5-day grace)
let lifecycleSet = false
export async function ensureLifecycleRule(): Promise<void> {
  if (lifecycleSet) return
  try {
    const r2 = getR2Client()
    await r2.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: R2_BUCKET,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'auto-delete-expired-transfers',
              Status: 'Enabled',
              Filter: { Prefix: '' },
              Expiration: { Days: 35 },
            },
          ],
        },
      }),
    )
    lifecycleSet = true
  } catch {
    // Non-fatal — objects will still be cleaned up by transfer delete logic
  }
}
