import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTransfer, updateTransfer } from '../../../../lib/transfer'
import { getSupabaseServerClient } from '../../../../supabase/server'
import { sendMail } from '../../../../email'
import { tplTransferReady, tplTransferSent } from '../../../../emailTemplates'
import { brand } from '../../../../brand'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ slug: z.string().min(1).max(120) })

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  await updateTransfer(body.data.slug, { completed: true })
  const t = await getTransfer(body.data.slug)

  if (t && t.recipientEmails.length > 0) {
    const url = `${brand.url}/transfer/${t.slug}`
    const tpl = tplTransferReady({
      title: t.title,
      url,
      senderMessage: t.message,
      fileCount: t.files.length,
      totalSize: formatBytes(t.totalSize),
      expiresAt: t.expiresAt,
    })
    // Send to each recipient (fire-and-forget)
    for (const to of t.recipientEmails) {
      void sendMail({ to, subject: tpl.subject, html: tpl.html, text: tpl.text })
    }
  }

  // Send "transfer ready" confirmation to sender (fire-and-forget)
  if (t) {
    const url = `${brand.url}/transfer/${t.slug}`
    let senderEmail: string | null = null
    try {
      const supabase = await getSupabaseServerClient()
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        senderEmail = user?.email ?? null
      }
    } catch { /* ignore */ }
    // Fall back to notifyEmail if no account email
    senderEmail = senderEmail ?? t.notifyEmail
    if (senderEmail) {
      const tpl = tplTransferSent({
        title: t.title,
        url,
        fileCount: t.files.length,
        totalSize: formatBytes(t.totalSize),
        expiresAt: t.expiresAt,
        recipientCount: t.recipientEmails.length,
      })
      void sendMail({ to: senderEmail, subject: tpl.subject, html: tpl.html, text: tpl.text })
    }
  }

  // Record in Supabase history (best-effort)
  if (t) {
    try {
      const supabase = await getSupabaseServerClient()
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('transfers').insert({
            user_id: user.id,
            slug: t.slug,
            title: t.title || t.message || null,
            files: t.files.map((f) => f.name),
            file_count: t.files.length,
            total_bytes: t.totalSize,
          })
        }
      }
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ ok: true })
}
