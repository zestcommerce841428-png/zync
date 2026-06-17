'use client'
/* eslint-disable @typescript-eslint/no-use-before-define */

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import GoogleIcon from '@mui/icons-material/Google'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { ZyncIcon } from '../Logo'
import { getSupabaseBrowserClient } from '../../supabase/client'
import { brand } from '../../brand'

type Mode = 'signin' | 'signup'

export default function AuthHub(): React.ReactElement {
  const supabase = getSupabaseBrowserClient()
  const [mode, setMode] = React.useState<Mode>('signin')
  const [next, setNext] = React.useState('/account')

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const n = p.get('next')
    if (n) setNext(n)
    if (p.get('mode') === 'signup') setMode('signup')
  }, [])

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', mb: 2 }}>
            <ZyncIcon size={52} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {mode === 'signin' ? `Sign in to ${brand.name}` : `Create your ${brand.name} account`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A free account unlocks unlimited, private file transfers.
            </Typography>
          </Stack>

          {!supabase ? (
            <Alert severity="info">
              Authentication isn’t configured yet. Add your Supabase keys to
              enable sign-in.
            </Alert>
          ) : (
            <>
              <Tabs
                value={mode}
                onChange={(_, v) => setMode(v)}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab value="signin" label="Sign in" />
                <Tab value="signup" label="Create account" />
              </Tabs>

              {mode === 'signin' ? (
                <SignInForm next={next} />
              ) : (
                <SignUpForm next={next} />
              )}

              <Divider sx={{ my: 3 }}>or</Divider>
              <GoogleButton next={next} />
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

function GoogleButton({ next }: { next: string }): React.ReactElement {
  const supabase = getSupabaseBrowserClient()
  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      startIcon={<GoogleIcon />}
      onClick={() =>
        supabase?.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })
      }
    >
      Continue with Google
    </Button>
  )
}

function SignInForm({ next }: { next: string }): React.ReactElement {
  const supabase = getSupabaseBrowserClient()!
  const [useOtp, setUseOtp] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [otpSent, setOtpSent] = React.useState(false)
  const [otp, setOtp] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)

  const go = () => (window.location.href = next)

  const passwordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
    else go()
  }

  const sendOtp = async () => {
    setBusy(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    if (error) setError(error.message)
    else { setOtpSent(true); setInfo('We emailed you a 6-digit code.') }
  }

  const verifyOtp = async () => {
    setBusy(true); setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setBusy(false)
    if (error) setError(error.message)
    else go()
  }

  const forgot = async () => {
    if (!email) { setError('Enter your email first.'); return }
    setBusy(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) setError(error.message)
    else setInfo('Password reset link sent — check your email.')
  }

  return (
    <Box component="form" onSubmit={passwordSignIn}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="success">{info}</Alert>}

        <TextField
          label="Email"
          type="email"
          required
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {!useOtp && (
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {useOtp && otpSent && (
          <TextField
            label="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
            fullWidth
          />
        )}

        {!useOtp ? (
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? <CircularProgress size={22} /> : 'Sign in'}
          </Button>
        ) : otpSent ? (
          <Button onClick={verifyOtp} variant="contained" size="large" disabled={busy}>
            {busy ? <CircularProgress size={22} /> : 'Verify code'}
          </Button>
        ) : (
          <Button onClick={sendOtp} variant="contained" size="large" disabled={busy || !email}>
            {busy ? <CircularProgress size={22} /> : 'Email me a code'}
          </Button>
        )}

        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Link component="button" type="button" variant="body2" onClick={() => { setUseOtp(!useOtp); setOtpSent(false); setError(null); setInfo(null) }}>
            {useOtp ? 'Use password instead' : 'Use a one-time code'}
          </Link>
          {!useOtp && (
            <Link component="button" type="button" variant="body2" onClick={forgot}>
              Forgot password?
            </Link>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

function SignUpForm({ next }: { next: string }): React.ReactElement {
  const supabase = getSupabaseBrowserClient()!
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    setBusy(true); setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setBusy(false); setError(error.message); return }

    // If a session exists (auto-confirm), upload the photo now and continue.
    if (data.session) {
      if (photo) {
        const form = new FormData()
        form.append('file', photo)
        await fetch('/api/profile/avatar', { method: 'POST', body: form }).catch(() => {})
      }
      window.location.href = next
      return
    }

    setBusy(false)
    setInfo('Account created! Check your email to confirm, then sign in. You can add your photo from your profile.')
  }

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="success">{info}</Alert>}

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar src={photoPreview || undefined} sx={{ width: 64, height: 64 }}>
            {fullName?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileRef.current?.click()}
            >
              {photo ? 'Change photo' : 'Add photo'}
            </Button>
            {photo && (
              <IconButton size="small" onClick={() => { setPhoto(null); setPhotoPreview(null) }} aria-label="Remove photo">
                ✕
              </IconButton>
            )}
          </Box>
        </Stack>

        <TextField label="Full name" required fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Email" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" required fullWidth value={password} onChange={(e) => setPassword(e.target.value)} helperText="At least 8 characters" />
        <TextField label="Confirm password" type="password" required fullWidth value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? <CircularProgress size={22} /> : 'Create account'}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          By creating an account you agree to our{' '}
          <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </Typography>
      </Stack>
    </Box>
  )
}
