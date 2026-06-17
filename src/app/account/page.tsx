import type { Metadata } from 'next'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { getCurrentUser } from '../../supabase/server'
import { isSupabaseConfigured, isAdminEmail } from '../../supabase/config'
import AccountView from '../../components/AccountView'
import PageShell from '../../components/PageShell'

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Manage your Zync profile.',
  robots: { index: false, follow: false },
}

export default async function AccountPage(): Promise<React.ReactElement> {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Your account" subtitle="Accounts are optional on Zync.">
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              Authentication isn’t configured on this deployment yet. Add your
              Supabase keys to enable accounts.
            </Typography>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return (
      <Container maxWidth="xs" sx={{ py: { xs: 8, md: 12 } }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                You’re not signed in
              </Typography>
              <Button href="/login" variant="contained">
                Sign in
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    )
  }

  const meta = (user.user_metadata || {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 8 } }}>
      <AccountView
        email={user.email || ''}
        name={meta.full_name || meta.name || ''}
        avatarUrl={meta.avatar_url || null}
        isAdmin={isAdminEmail(user.email)}
      />
    </Container>
  )
}
