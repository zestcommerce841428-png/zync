import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp, rateLimitHeaders } from '../../../rateLimit'
import { verifyRecaptcha } from '../../../recaptcha'
import { sendMail } from '../../../email'
import { brand } from '../../../brand'

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().max(160).optional(),
  message: z.string().min(10).max(5000),
  recaptchaToken: z.string().optional(),
  // Honeypot — bots fill this; humans never see it.
  website: z.string().max(0).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request)
  const limit = await rateLimit(`contact:${ip}`, { limit: 5, windowSeconds: 600 })
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(limit) },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the form and try again.' },
      { status: 400 },
    )
  }
  const { name, email, subject, message, recaptchaToken, website } = parsed.data

  // Honeypot triggered — pretend success, drop silently.
  if (website) return NextResponse.json({ ok: true })

  const captcha = await verifyRecaptcha(recaptchaToken)
  if (!captcha.ok) {
    return NextResponse.json(
      { error: 'Spam check failed. Please try again.' },
      { status: 400 },
    )
  }

  const result = await sendMail({
    to: brand.contact.email,
    subject: `[${brand.name} Contact] ${subject || 'New message'} — from ${name}`,
    replyTo: email,
    text: `From: ${name} <${email}>\nIP: ${ip}\n\n${message}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>IP:</strong> ${ip}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
  })

  // Even if SMTP isn't configured yet, accept the message so the UX works.
  return NextResponse.json(
    { ok: true, delivered: result.success },
    { headers: rateLimitHeaders(limit) },
  )
}
