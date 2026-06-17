# Deploying Zync for free (all features)

This guide deploys Zync — transfers, accounts, blog, tools, email, analytics —
on **100% free tiers**. Everything is optional and degrades gracefully, so you
can launch with the basics in ~10 minutes and switch features on as you add
keys.

## The free stack

| Concern | Free service | Notes |
| --- | --- | --- |
| App hosting | **Vercel** (Hobby) | Best for Next.js. No card required. |
| Channel metadata / stats / presence | **Upstash Redis** (free) | Needed for scaling across serverless instances. |
| Auth, accounts, Google login, storage | **Supabase** (free) | 50k MAU, 1 GB storage, Postgres. |
| Contact email (SMTP) | **Hostinger** mailbox _or_ **Brevo** (free 300/day) | |
| Profile photo upload | **Hostinger PHP** (`deploy/hostinger/api4/`) _or_ Supabase Storage | |
| STUN (NAT discovery) | **Google STUN** (free, default) | Works for ~80–90% of transfers. |
| TURN relay (strict NAT) | **Metered Open Relay** (free 50 GB/mo) — optional | |
| PeerJS signaling | **Public 0.peerjs.com** (default) _or_ self-host on Render (free) | |
| Analytics | **Google Analytics 4** (free) | |
| Anti-spam | **reCAPTCHA v3** (free) | |

> On Vercel you do **not** need `output: 'standalone'` — Vercel uses its own
> adapter, so the Windows standalone/symlink build quirk does not apply.

---

## 1. Deploy the app on Vercel (required)

1. Push the repo to GitHub (already done: `zync`).
2. Go to **vercel.com → New Project → Import** your `zync` repo.
3. Framework preset: **Next.js** (auto-detected). Build command and output are
   automatic. Click **Deploy**.
4. Your app is live at `https://zync-xxxx.vercel.app`. Add a custom domain later
   under **Settings → Domains** (free).

Set this first environment variable (**Settings → Environment Variables**):

```
NEXT_PUBLIC_SITE_URL = https://your-app.vercel.app
```

That alone gives you: transfers (in-memory), the marketing site, 140 blog
posts, 15 tools, theme/accessibility, cookie consent. Add the rest below to
unlock accounts, email, etc., then **Redeploy**.

---

## 2. Redis — Upstash (recommended for production)

Without Redis, channel metadata/stats/presence are stored in memory **per
serverless instance**, which breaks across Vercel's multiple instances. Upstash
fixes this for free.

1. **upstash.com → Create Database** (Redis, pick a region near your users).
2. Copy the **`UPSTASH_REDIS_URL`** (the `rediss://...` connection string).
3. In Vercel add:

```
REDIS_URL = rediss://default:********@your-db.upstash.io:6379
```

| Variable | Meaning |
| --- | --- |
| `REDIS_URL` | Connection string for Redis used to store channel metadata, stats and presence. If not set, Zync falls back to in-memory storage. |

---

## 3. Accounts, Google login, avatars — Supabase

1. **supabase.com → New project** (free). Note the **Project URL** and
   **anon key** (Settings → API), and the **service_role key** (keep secret).
2. **Authentication → Providers → Google**: enable it, paste a Google OAuth
   client id/secret (create at console.cloud.google.com → Credentials), and set
   the redirect URL to `https://YOUR-SUPABASE.supabase.co/auth/v1/callback`.
3. **Authentication → URL Configuration**: add your Vercel URL to
   *Site URL* and *Redirect URLs* (`https://your-app.vercel.app/**`).
4. **Authentication → Multi-Factor**: enable **TOTP** (for 2FA).
5. **Storage → New bucket** named `avatars`, set it **public** (only if you use
   Supabase for photos rather than the PHP endpoint).
6. Vercel env:

```
NEXT_PUBLIC_SUPABASE_URL = https://YOUR.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key   # enables account deletion
SUPABASE_AVATAR_BUCKET = avatars
ADMIN_EMAILS = contact@zestcommere.in                # your /admin access
```

Once these are set, gating activates: visiting `/send`, `/stats`, `/account`,
`/admin` requires login.

---

## 4. Contact email — Hostinger SMTP

Use your Hostinger mailbox (free with hosting):

```
SMTP_HOST = smtp.hostinger.com
SMTP_PORT = 465
SMTP_USER = contact@zestcommere.in
SMTP_PASS = your-mailbox-password
SMTP_FROM = contact@zestcommere.in
```

(No SMTP? The contact form still accepts messages and logs them; or use Brevo's
free SMTP relay.)

---

## 5. Profile-photo upload — Hostinger PHP

You already have the endpoint files in `deploy/hostinger/api4/`. Upload them to
`https://api.zestcommerce.in/api4/`, make `uploads/` writable, then set:

```
HOSTINGER_UPLOAD_URL = https://api.zestcommerce.in/api4/upload.php
HOSTINGER_API_TOKEN  = <same secret as ZYNC_UPLOAD_SECRET in api4/config.php>
```

See `deploy/hostinger/api4/README.md`. (If you skip this, photos use Supabase
Storage instead.)

---

## 6. Analytics & reCAPTCHA (free)

```
NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX                 # analytics.google.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY = your-site-key   # google.com/recaptcha (v3)
RECAPTCHA_SECRET_KEY = your-secret-key
```

GA loads **only after** a visitor accepts cookies in the consent banner.

---

## 7. WebRTC: STUN / TURN / PeerJS

These control how peers connect. The defaults work for most users for free.

| Variable | Default | Meaning |
| --- | --- | --- |
| `COTURN_ENABLED` | _(off)_ | Set `true` to enable TURN relay for peers behind strict NAT. |
| `TURN_HOST` | `127.0.0.1` | Hostname/IP of the TURN server. |
| `TURN_REALM` | `zync.app` | Realm used when generating TURN credentials. |
| `STUN_SERVER` | `stun:stun.l.google.com:19302` | STUN URL used when `COTURN_ENABLED` is off. |
| `PEERJS_HOST` | `0.peerjs.com` | Host of the (self-hosted) PeerJS signaling server. |
| `PEERJS_PATH` | `/` | Path of the PeerJS server. |

### Free recommendations

- **STUN only (simplest, free):** leave everything default. Google's STUN
  handles the majority of connections at no cost.
- **Free TURN for strict networks:** sign up for **Metered Open Relay** (free
  50 GB/month). Their TURN uses static credentials, so point `STUN_SERVER` at a
  relay URL or extend `src/app/api/ice/route.ts` to return the Open Relay
  `iceServers` array (host, username, credential). TURN is only used as a
  fallback when a direct path fails.
- **PeerJS:** the public `0.peerjs.com` is free but shared/rate-limited. For
  reliability, self-host the PeerJS server (this repo ships `bin/peerjs.js`) on
  a **free Render/Railway** web service, then set `PEERJS_HOST` to that host and
  `PEERJS_PATH` to `/`.

---

## 8. Final checklist

- [ ] `NEXT_PUBLIC_SITE_URL` points to your real domain.
- [ ] `FILEPIZZA_SECRET` set to a long random string (signs session cookies).
- [ ] Supabase Site/Redirect URLs include your domain.
- [ ] Redeploy on Vercel after adding env vars.
- [ ] Test: sign up → upload avatar → send a file → check `/stats` and `/admin`.

### A note on serverless + SSE

Vercel Hobby functions are short-lived, so the live-presence SSE stream may
periodically reconnect (the browser's `EventSource` does this automatically).
With Upstash Redis configured, presence/stats stay consistent across
reconnects. For always-on SSE, host on Render/Railway/Fly (also free tiers)
instead of Vercel.

---

## Enabling ALL optionals for free (self-hosted TURN + PeerJS)

Serverless hosts (Vercel, **Cloudflare Workers**) **cannot** run self-hosted
coturn (TURN) or the PeerJS WebSocket server — those need a VM with a public IP
and open UDP ports. For a single-box, 100%-free, all-features deploy use
**Oracle Cloud Always Free** (ARM Ampere VM): see
**[deploy/oracle/README.md](../deploy/oracle/README.md)** with ready-made
`turnserver.conf`, `Caddyfile`, `systemd` units and a `setup.sh`.

> Cloudflare Workers note: Zync uses `ioredis` (raw TCP) for Redis/stats/
> presence/TURN credentials, which Workers don't support. Cloudflare is still
> useful for free DNS/CDN and its managed **Realtime TURN** (a small change to
> `src/app/api/ice/route.ts` to return its `iceServers`).

## Alternative all-in-one free hosts

If you'd rather not split services, **Render** or **Railway** can run the
Next.js app (and a Redis instance and the PeerJS server) together on their free
tiers. Use the included `Dockerfile`, or their native Node build, and set the
same environment variables above.
