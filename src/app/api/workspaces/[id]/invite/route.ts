import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '../../../../../supabase/server'
import { getWorkspace, createInvite } from '../../../../../lib/workspace'
import { sendMail } from '../../../../../email'
import { brand } from '../../../../../brand'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  email: z.string().email().max(200),
  role: z.enum(['admin', 'member']).default('member'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient()
  if (!supabase)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ws = await getWorkspace(id)
  if (!ws) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const isAdmin = ws.members.some(
    (m) => m.userId === user.id && (m.role === 'owner' || m.role === 'admin'),
  )
  if (!isAdmin)
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  if (ws.members.length >= 50)
    return NextResponse.json({ error: 'Maximum 50 members.' }, { status: 429 })

  const alreadyMember = ws.members.some((m) => m.email === body.data.email)
  if (alreadyMember)
    return NextResponse.json({ error: 'Already a member.' }, { status: 409 })

  const token = await createInvite(id, body.data.email, body.data.role)
  const inviteUrl = `${brand.url}/workspaces/join/${token}`
  const inviterName = user.user_metadata?.full_name || user.email || 'Someone'

  void sendMail({
    to: body.data.email,
    subject: `${inviterName} invited you to "${ws.name}" on ${brand.name}`,
    html: `<p>Hi,</p>
<p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${ws.name}</strong> on ${brand.name}.</p>
<p><a href="${inviteUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Accept invitation</a></p>
<p style="color:#666;font-size:13px;">This invite expires in 7 days. If you did not expect this, you can safely ignore it.</p>`,
    text: `${inviterName} invited you to join "${ws.name}" on ${brand.name}.\n\nAccept: ${inviteUrl}\n\nExpires in 7 days.`,
  })

  return NextResponse.json({ ok: true, token })
}
