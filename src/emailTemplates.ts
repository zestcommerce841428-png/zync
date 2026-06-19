import 'server-only'
import { brand } from './brand'

// ─────────────────────────────────────────────────────────────────────────────
// Professional, responsive, brand-consistent HTML email layout + templates.
// All transactional / operational emails render through `baseLayout` so they
// share the same polished look (works in Gmail, Outlook, Apple Mail).
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5' // indigo
const BG = '#f4f4f7'
const CARD = '#ffffff'
const TEXT = '#1f2330'
const MUTED = '#6b7280'

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  )
}

export type EmailButton = { label: string; url: string }

export function baseLayout(opts: {
  preheader?: string
  heading: string
  intro?: string
  bodyHtml: string
  button?: EmailButton
  footerNote?: string
}): string {
  const { preheader = '', heading, intro = '', bodyHtml, button, footerNote } = opts
  const year = new Date().getFullYear()
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <tr><td style="padding:8px 8px 20px;text-align:center;">
      <span style="font-size:20px;font-weight:800;letter-spacing:.5px;color:${PRIMARY};">${esc(brand.name)}</span>
    </td></tr>
    <tr><td style="background:${CARD};border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06);">
      <h1 style="margin:0 0 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;color:${TEXT};">${esc(heading)}</h1>
      ${intro ? `<p style="margin:0 0 16px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${MUTED};">${esc(intro)}</p>` : ''}
      <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${TEXT};">${bodyHtml}</div>
      ${
        button
          ? `<div style="text-align:center;margin:28px 0 8px;"><a href="${esc(button.url)}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;">${esc(button.label)}</a></div>`
          : ''
      }
      ${footerNote ? `<p style="margin:20px 0 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};">${footerNote}</p>` : ''}
    </td></tr>
    <tr><td style="padding:20px 12px;text-align:center;">
      <p style="margin:0 0 6px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${MUTED};">
        ${esc(brand.tagline || 'Private peer-to-peer file transfer')}
      </p>
      <p style="margin:0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${MUTED};">
        <a href="${esc(brand.url)}" style="color:${PRIMARY};text-decoration:none;">${esc(brand.url.replace(/^https?:\/\//, ''))}</a>
        &nbsp;·&nbsp; © ${year} ${esc(brand.org.legalName || brand.name)}
      </p>
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

function kv(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;border:1px solid #eee;border-radius:10px;overflow:hidden;">${rows
    .map(
      ([k, v], i) =>
        `<tr style="background:${i % 2 ? '#fafafa' : '#fff'};"><td style="padding:10px 14px;font-size:13px;color:${MUTED};width:38%;">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;color:${TEXT};font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join('')}</table>`
}

// ── Specific templates ──────────────────────────────────────────────────────

export function tplWelcome(name: string): { subject: string; html: string; text: string } {
  return {
    subject: `Welcome to ${brand.name} 🎉`,
    text: `Hi ${name}, welcome to ${brand.name}! Your account is ready. Open ${brand.url}/account`,
    html: baseLayout({
      preheader: `Your ${brand.name} account is ready.`,
      heading: `Welcome aboard, ${name}!`,
      intro: `Thanks for creating a ${brand.name} account. You now have access to unlimited, private, peer-to-peer file transfers and the full tool suite.`,
      bodyHtml: `<ul style="margin:0;padding-left:18px;color:${TEXT};"><li>End-to-end encrypted transfers — files never touch a server</li><li>No size limits</li><li>Your private dashboard, profile and tools</li></ul>`,
      button: { label: 'Open your dashboard', url: `${brand.url}/account` },
      footerNote: `If you didn't create this account, you can safely ignore this email.`,
    }),
  }
}

export function tplSignInAlert(name: string, meta: { time: string; ip?: string; agent?: string }): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `New sign-in to your ${brand.name} account`,
    text: `Hi ${name}, a new sign-in to your ${brand.name} account at ${meta.time}. If this wasn't you, reset your password at ${brand.url}/reset-password`,
    html: baseLayout({
      preheader: `New sign-in detected on your account.`,
      heading: `New sign-in detected`,
      intro: `Hi ${name}, we noticed a new sign-in to your ${brand.name} account.`,
      bodyHtml: kv([
        ['Time', meta.time],
        ['IP address', meta.ip || 'unknown'],
        ['Device', meta.agent || 'unknown'],
      ]),
      button: { label: 'Review account security', url: `${brand.url}/account` },
      footerNote: `If this was you, no action is needed. If not, <a href="${brand.url}/reset-password" style="color:${PRIMARY};">reset your password</a> immediately.`,
    }),
  }
}

export function tplAccountDeleted(name: string): { subject: string; html: string; text: string } {
  return {
    subject: `Your ${brand.name} account has been deleted`,
    text: `Hi ${name}, your ${brand.name} account and data have been permanently deleted. Sorry to see you go.`,
    html: baseLayout({
      preheader: `Your account has been permanently deleted.`,
      heading: `Account deleted`,
      intro: `Hi ${name}, your ${brand.name} account and associated data have been permanently removed, as requested.`,
      bodyHtml: `<p style="margin:0;color:${TEXT};">We're sorry to see you go. You're always welcome back — just sign up again any time.</p>`,
      button: { label: `Visit ${brand.name}`, url: brand.url },
    }),
  }
}

export function tplContactReceipt(name: string): { subject: string; html: string; text: string } {
  return {
    subject: `We received your message — ${brand.name}`,
    text: `Hi ${name}, thanks for contacting ${brand.name}. We've received your message and will reply soon.`,
    html: baseLayout({
      preheader: `Thanks — we received your message.`,
      heading: `Thanks for reaching out!`,
      intro: `Hi ${name}, we've received your message and our team will get back to you shortly.`,
      bodyHtml: `<p style="margin:0;color:${TEXT};">Need a faster response? Message us on WhatsApp at <b>+91 ${esc(brand.contact.whatsapp)}</b>.</p>`,
      button: { label: `Back to ${brand.name}`, url: brand.url },
    }),
  }
}

export function tplContactAdmin(d: { name: string; email: string; message: string; ip?: string }): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `📨 New contact form message from ${d.name}`,
    text: `From: ${d.name} <${d.email}>\nIP: ${d.ip || '-'}\n\n${d.message}`,
    html: baseLayout({
      preheader: `New contact message from ${d.name}`,
      heading: `New contact message`,
      bodyHtml:
        kv([
          ['Name', d.name],
          ['Email', d.email],
          ['IP', d.ip || '-'],
        ]) +
        `<p style="margin:14px 0 0;color:${TEXT};white-space:pre-wrap;">${esc(d.message)}</p>`,
      button: { label: 'Reply', url: `mailto:${d.email}` },
    }),
  }
}

export function tplCriticalAlert(d: { event: string; detail: string }): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `🚨 [${brand.name}] ${d.event}`,
    text: `Critical/operational event: ${d.event}\n\n${d.detail}`,
    html: baseLayout({
      preheader: `Operational alert: ${d.event}`,
      heading: `⚠️ ${d.event}`,
      intro: `An operational event was recorded on ${brand.name}.`,
      bodyHtml: `<p style="margin:0;color:${TEXT};white-space:pre-wrap;">${esc(d.detail)}</p>`,
      button: { label: 'Open admin', url: `${brand.url}/admin` },
    }),
  }
}
