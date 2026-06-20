import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTransfer, hashPassword } from '../../../../../lib/transfer'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ password: z.string().min(1) })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const body = BodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success)
    return NextResponse.json({ valid: false }, { status: 400 })

  const transfer = await getTransfer(slug)
  if (!transfer || !transfer.completed || !transfer.passwordHash)
    return NextResponse.json({ valid: false }, { status: 404 })

  const valid = hashPassword(body.data.password) === transfer.passwordHash
  return NextResponse.json({ valid })
}
