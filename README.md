# Zync — private, peer-to-peer file transfer

**Zync** beams files directly from one browser to another over an encrypted
WebRTC connection. Files are never uploaded to or stored on a server — when the
sender closes the tab, the transfer is gone. No accounts, no installs, no size
limits.

> Built by **Naushad Alam** · engineered with **Claude** · operated under ZestCommerce.

Live transfer tool, a marketing site, a 140-article blog, optional accounts,
and a full accessibility suite — all in one production-ready Next.js app.

---

## ✨ Features

### Transfer engine
- **True peer-to-peer** file transfer via WebRTC DataChannels (PeerJS)
- **End-to-end encrypted** by default (WebRTC DTLS) + optional password lock
- **No server storage** — nothing is retained after a transfer
- **Rooms**: multiple recipients, optional **download caps**
- **Resumable** transfers (offset persistence) and **live presence** via SSE
- **Real-time stats** dashboard at `/stats`

### Product & site
- Professional **landing page**, About, Contact, and full **compliance** suite
  (Privacy, Terms, Cookies, Acceptable Use, DMCA)
- **Blog** with 140+ SEO-ready articles, full-text **search**, category
  **filters**, and **pagination**
- **Material UI** design system with light/dark and dynamic theming
- **Advanced personalization panel**: 13 accent colors, 6 fonts, density,
  radius, text scaling, RTL, and a deep **accessibility** suite (contrast,
  saturation, reduced motion, dyslexia spacing, reading guide, big cursor,
  enhanced focus, link/heading highlights, and more)

### Platform
- **Supabase** auth (Login with Google), profile + avatar upload
- **Super-admin** dashboard (`/admin`) gated by an email allowlist
- **Hostinger SMTP** contact form + **profile-photo upload** API
- **Google Analytics** + **reCAPTCHA v3** (env-gated)
- **Per-IP rate limiting**, signed anonymous sessions, security headers
- SEO: dynamic **sitemap**, **robots**, **JSON-LD**, OpenGraph image, canonical URLs

Every integration is **optional** — the app runs fully without any keys and
lights features up as you add them.

---

## 🚀 Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Regenerate the blog content (already committed):

```bash
node scripts/generate-blog.mjs
```

## ⚙️ Configuration

Copy `.env.local.example` to `.env.local` and fill in only what you need:

| Area | Variables |
| --- | --- |
| Site | `NEXT_PUBLIC_SITE_URL` |
| Scaling | `REDIS_URL` |
| Auth/Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_AVATAR_BUCKET` |
| Admin | `ADMIN_EMAILS` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Photo upload fallback | `HOSTINGER_UPLOAD_URL`, `HOSTINGER_API_TOKEN` |
| Analytics | `NEXT_PUBLIC_GA_ID` |
| reCAPTCHA | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` |
| WebRTC TURN | `COTURN_ENABLED`, `TURN_HOST`, `TURN_REALM`, `STUN_SERVER` |

## 🧱 Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Material UI** + Emotion
- **WebRTC** via PeerJS · **Redis** (optional) for scaling
- **Supabase** (auth + storage) · **Nodemailer** (SMTP)
- **Vitest** + **Playwright**

## 📜 Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm type:check   # TypeScript
pnpm test         # unit tests
pnpm test:e2e     # Playwright
```

## 📬 Contact

- Email: **contact@zestcommere.in**
- WhatsApp: **+91 7492068998**

## 📄 License

BSD-3-Clause. Originally based on the open-source FilePizza project; reworked
and extended into Zync.
