<?php
/**
 * Zync upload endpoint configuration.
 *
 * IMPORTANT: ZYNC_UPLOAD_SECRET must EXACTLY match the HOSTINGER_API_TOKEN
 * value in your Zync app's .env.local. This is the shared secret that
 * authorizes uploads. Keep it private — never commit it to a public repo and
 * regenerate it if it is ever exposed.
 */

// ── Shared secret (both sides must match) ───────────────────────────────────
define('ZYNC_UPLOAD_SECRET', '98ada212409826373df0142b408e8282870b166d9d60377e237204aa63d5018e6bed72f73eed8afa15b10bc10cfbf78e');

// ── Where uploaded files are written on disk (auto-created) ─────────────────
define('ZYNC_UPLOAD_DIR', __DIR__ . '/uploads');

// ── Public URL that serves ZYNC_UPLOAD_DIR ──────────────────────────────────
// e.g. https://api.zestcommerce.in/api4/uploads/<userId>/<file>
define('ZYNC_PUBLIC_BASE', 'https://api.zestcommerce.in/api4/uploads');

// ── Maximum upload size in bytes (default 5 MB for avatars) ──────────────────
define('ZYNC_MAX_BYTES', 5 * 1024 * 1024);

// ── Allowed image types → file extension ────────────────────────────────────
$ZYNC_ALLOWED = array(
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/gif'  => 'gif',
);
