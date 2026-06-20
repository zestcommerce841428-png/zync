import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateTransfer } from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ slug: z.string().min(1).max(120) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  await updateTransfer(body.data.slug, { completed: true })

  // Record in Supabase history (best-effort, non-blocking)
  try {
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { getTransfer } = await import('../../../../lib/transfer')
        const t = await getTransfer(body.data.slug)
        if (t) {
          await supabase.from('transfers').insert({
            user_id: user.id,
            slug: t.slug,
            title: t.message || null,
            files: t.files.map((f) => f.name),
            file_count: t.files.length,
            total_bytes: t.totalSize,
          })
        }
      }
    }
  } catch {
    // history is best-effort
  }

  return NextResponse.json({ ok: true })
}
