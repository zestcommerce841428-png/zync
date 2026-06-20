import { NextRequest, NextResponse } from 'next/server'
import { getTransfer, deleteTransfer, removeUserTransferIndex } from '../../../../lib/transfer'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET } from '../../../../lib/r2'
import { getSupabaseServerClient } from '../../../../supabase/server'

export const dynamic = 'force-dynamic'

async function cleanupR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    const r2 = getR2Client()
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )
  } catch {
    // best-effort
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const transfer = await getTransfer(slug)

  if (!transfer || !transfer.completed) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  // Auto-cleanup expired transfer (R2 cost saving)
  if (new Date(transfer.expiresAt) < new Date()) {
    void cleanupR2(transfer.files.map((f) => f.key))
    void deleteTransfer(slug)
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const { files, passwordHash, notifyEmail, notifiedAt, recipientEmails, ...rest } = transfer
  return NextResponse.json({
    ...rest,
    passwordProtected: !!passwordHash,
    files: files.map(({ name, size, type }) => ({ name, size, type })),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const transfer = await getTransfer(slug)
  if (!transfer) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const supabase = await getSupabaseServerClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (transfer.ownerId && transfer.ownerId !== user?.id)
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  await cleanupR2(transfer.files.map((f) => f.key))
  await deleteTransfer(slug)

  if (transfer.ownerId) {
    void removeUserTransferIndex(transfer.ownerId, slug)
  }

  return NextResponse.json({ ok: true })
}
