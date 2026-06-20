import 'server-only'
import nodemailer from 'nodemailer'
import { brand } from './brand'
import { getAdminEmails } from './supabase/config'

// Email delivery via Hostinger SMTP (or any SMTP provider). Configured purely
// through environment variables; if SMTP isn't configured the helper logs the
// message and reports success=false so callers can degrade gracefully.
//
// Required env:
//   SMTP_HOST     (e.g. smtp.hostinger.com)
//   SMTP_PORT     (465 for SSL, 587 for STARTTLS)
//   SMTP_USER     (e.g. contact@zestcommere.in)
//   SMTP_PASS
//   SMTP_FROM     (optional; defaults to SMTP_USER)

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  )
}

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export type SendResult = { success: boolean; reason?: string }

export async function sendMail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to?: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}): Promise<SendResult> {
  if (!isEmailConfigured()) {
    console.warn('[email] SMTP not configured — message not sent:', {
      subject,
      text,
    })
    return { success: false, reason: 'not_configured' }
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to || brand.contact.email,
      subject,
      text,
      html,
      replyTo,
    })
    return { success: true }
  } catch (err) {
    console.error('[email] send failed:', err)
    return { success: false, reason: 'send_failed' }
  }
}

// Fan out an operational/critical notification to every admin in ADMIN_EMAILS.
export async function notifyAdmins(msg: {
  subject: string
  text: string
  html?: string
}): Promise<void> {
  const admins = getAdminEmails()
  if (admins.length === 0) return
  await Promise.allSettled(admins.map((to) => sendMail({ to, ...msg })))
}

// Best-effort fire-and-forget send (won't block or throw in request handlers).
export function sendMailBg(args: Parameters<typeof sendMail>[0]): void {
  sendMail(args).catch((e) => console.error('[email] bg send failed:', e))
}
