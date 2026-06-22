import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { saveCollect } from '../../../../lib/collect'
import { getSupabaseServerClient } from '../../../../supabase/server'
import { generateShortSlug } from '../../../../slugs'
import { rateLimit, getClientIp } from '../../../../rateLimit'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  expiryDays: z.number().int().min(1).max(365).default(30),
  maxFiles: z.number().int().min(1).max(100).default(20),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req)
  const rl = await rateLimit(`collect-create:${ip}`, { limit: 20, windowSeconds: 3600 })
  if (!rl.success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to create a file request.' }, { status: 401 })

  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  const { title, description, expiryDays, maxFiles } = body.data
  const slug = await generateShortSlug()
  const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString()

  await saveCollect({
    slug,
    ownerId: user.id,
    ownerEmail: user.email ?? '',
    title,
    description,
    expiresAt,
    maxFiles,
    files: [],
    createdAt: new Date().toISOString(),
    active: true,
  })

  return NextResponse.json({ slug, expiresAt }, { status: 201 })
}
