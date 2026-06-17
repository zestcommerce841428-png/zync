'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { ZyncIcon } from '../../components/Logo'
import { getSupabaseBrowserClient } from '../../supabase/client'

export default function ResetPasswordPage(): React.ReactElement {
  const supabase = getSupabaseBrowserClient()
  const [ready, setReady] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    if (!supabase) return
    // The recovery link establishes a temporary session; allow updating once
    // we have one (either already present or via the PASSWORD_RECOVERY event).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    setBusy(true); setError(null)
    const { error } = await supabase!.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 8, md: 12 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <ZyncIcon size={52} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Choose a new password
            </Typography>

            {!supabase ? (
              <Alert severity="info" sx={{ width: '100%' }}>Authentication isn’t configured.</Alert>
            ) : done ? (
              <>
                <Alert severity="success" sx={{ width: '100%' }}>
                  Password updated. You can now sign in.
                </Alert>
                <Button href="/login" variant="contained">Go to sign in</Button>
              </>
            ) : !ready ? (
              <Alert severity="warning" sx={{ width: '100%' }}>
                Open this page from the password-reset link in your email.
              </Alert>
            ) : (
              <Stack component="form" onSubmit={submit} spacing={2} sx={{ width: '100%' }}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="New password" type="password" required fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
                <TextField label="Confirm password" type="password" required fullWidth value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  {busy ? <CircularProgress size={22} /> : 'Update password'}
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
