'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import GoogleIcon from '@mui/icons-material/Google'
import { ZyncIcon } from '../../components/Logo'
import { getSupabaseBrowserClient } from '../../supabase/client'
import { brand } from '../../brand'

export default function LoginPage(): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const supabase = getSupabaseBrowserClient()

  const signInWithGoogle = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 8, md: 12 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <ZyncIcon size={56} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Sign in to {brand.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Optional — create an account to manage your profile. You never need
              an account to send or receive files.
            </Typography>

            {!supabase ? (
              <Alert severity="info" sx={{ width: '100%' }}>
                Authentication isn’t configured yet. Add your Supabase keys to
                enable sign-in.
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                  </Alert>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  Continue with Google
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
