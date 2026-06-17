# Zync upload endpoint (PHP / shared hosting)

Drop-in profile-photo upload API for Hostinger (or any PHP shared host),
designed to match the Zync app's `storage.ts` Hostinger fallback.

## What goes where

Upload the contents of this folder to your endpoint path so the files live at:

```
https://api.zestcommerce.in/api4/
├── upload.php          ← the endpoint the app calls
├── config.php          ← holds the SHARED SECRET (keep private!)
├── index.php           ← health check
├── .htaccess           ← forwards Authorization header, hides config
└── uploads/            ← created files are served from here
    └── .htaccess       ← disables script execution (security)
```

The `uploads/` directory must be writable by PHP (chmod `755`, or `775` if your
host requires it).

## The shared secret

`config.php` already contains a strong secret:

```
98ada212409826373df0142b408e8282870b166d9d60377e237204aa63d5018e6bed72f73eed8afa15b10bc10cfbf78e
```

Set the **same** value in your Zync app's `.env.local`:

```bash
HOSTINGER_UPLOAD_URL=https://api.zestcommerce.in/api4/upload.php
HOSTINGER_API_TOKEN=98ada212409826373df0142b408e8282870b166d9d60377e237204aa63d5018e6bed72f73eed8afa15b10bc10cfbf78e
```

> Rotate this secret if it is ever exposed: change it in `config.php` **and**
> in `.env.local` so both sides match.

## Test it

```bash
# Health check
curl https://api.zestcommerce.in/api4/

# Upload (replace SECRET and the image path)
curl -X POST https://api.zestcommerce.in/api4/upload.php \
  -H "Authorization: Bearer 98ada212409826373df0142b408e8282870b166d9d60377e237204aa63d5018e6bed72f73eed8afa15b10bc10cfbf78e" \
  -F "file=@avatar.png" \
  -F "path=demo-user/avatar.png"
# → {"ok":true,"url":"https://api.zestcommerce.in/api4/uploads/demo-user/avatar.png"}
```

## How it's wired

When `HOSTINGER_UPLOAD_URL` is set, the Zync app sends authenticated avatar
uploads here (multipart `file` + `path`, `Authorization: Bearer <secret>`),
and stores the returned `url` on the user's profile. Limits, allowed types
(jpg/png/webp/gif) and the 5 MB cap are enforced in `config.php` / `upload.php`.

## Troubleshooting

- **401 Unauthorized** — the secret in `config.php` doesn't match
  `HOSTINGER_API_TOKEN`, or your host stripped the `Authorization` header
  (the included `.htaccess` forwards it; ensure `mod_rewrite` is enabled).
- **500 on store** — `uploads/` is not writable; fix its permissions.
- **415 Unsupported** — only jpg/png/webp/gif are accepted by default.
