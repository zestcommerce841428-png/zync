import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { setTurnCredentials } from '../../../coturn'

const turnHost = process.env.TURN_HOST || '127.0.0.1'
const stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302'
const peerjsHost = process.env.PEERJS_HOST || '0.peerjs.com'
const peerjsPath = process.env.PEERJS_PATH || '/'

type IceServer = {
  urls: string | string[]
  username?: string
  credential?: string
}

export async function POST(): Promise<NextResponse> {
  const iceServers: IceServer[] = [{ urls: stunServer }]

  // Mode 1 — Static TURN (e.g. Metered Open Relay, Twilio, Cloudflare).
  // Set TURN_URLS (comma-separated) + TURN_USERNAME + TURN_CREDENTIAL.
  // No coturn or Redis required — ideal for free hosting without a VM.
  const staticUrls = process.env.TURN_URLS
  if (staticUrls) {
    iceServers.push({
      urls: staticUrls.split(',').map((u) => u.trim()).filter(Boolean),
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    })
    return NextResponse.json({ host: peerjsHost, path: peerjsPath, iceServers })
  }

  // Mode 2 — Self-hosted coturn with ephemeral credentials stored in Redis.
  if (process.env.COTURN_ENABLED) {
    const username = crypto.randomBytes(8).toString('hex')
    const password = crypto.randomBytes(8).toString('hex')
    const ttl = 86400 // 24 hours
    await setTurnCredentials(username, password, ttl)
    iceServers.push({
      urls: [`turn:${turnHost}:3478`, `turns:${turnHost}:5349`],
      username,
      credential: password,
    })
    return NextResponse.json({ host: peerjsHost, path: peerjsPath, iceServers })
  }

  // Mode 3 — STUN only (default; works for the majority of networks).
  return NextResponse.json({ host: peerjsHost, path: peerjsPath, iceServers })
}
