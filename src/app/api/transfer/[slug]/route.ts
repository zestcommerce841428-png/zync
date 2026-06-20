import { NextRequest, NextResponse } from 'next/server'
import { getTransfer, deleteTransfer } from '../../../../lib/transfer'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET } from '../../../../lib/r2'
import { getSupabaseServerClient } from '../../../../supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const transfer = await getTransfer(slug)
  if (!transfer || !transfer.completed)
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  // Strip internal R2 keys from public response
  const { files, ...rest } = transfer
  return NextResponse.json({
    ...rest,
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

  // Only owner can delete
  const supabase = await getSupabaseServerClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (transfer.ownerId && transfer.ownerId !== user?.id)
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  // Delete objects from R2
  try {
    const r2 = getR2Client()
    await r2.send(new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: {
        Objects: transfer.files.map((f) => ({ Key: f.key })),
        Quiet: true,
      },
    }))
  } catch {
    // best-effort R2 deletion
  }

  await deleteTransfer(slug)
  return NextResponse.json({ ok: true })
}
