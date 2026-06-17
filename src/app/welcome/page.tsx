import type { Metadata } from 'next'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as ViewTransitionLink } from 'next-view-transitions'
import { ZyncIcon } from '../../components/Logo'
import AnimatedBackground from '../../components/AnimatedBackground'
import { brand } from '../../brand'

export const metadata: Metadata = {
  title: 'Welcome',
  description: `Welcome to ${brand.name} — get started sending unlimited, private, peer-to-peer files in seconds.`,
  alternates: { canonical: '/welcome' },
}

const STEPS = [
  { n: '1', title: 'Create your free account', body: 'A one-time sign-up unlocks unlimited transfers. Use email, a one-time code, or Google.' },
  { n: '2', title: 'Drop a file', body: 'Open the sender and drag in any file — there are no size limits.' },
  { n: '3', title: 'Share the link or QR', body: 'Send the link to anyone. Their browser connects straight to yours.' },
  { n: '4', title: 'Watch it fly', body: 'Track progress and live presence in real time. Close the tab when you’re done — nothing is stored.' },
]

const PERKS = ['Unlimited file size', 'End-to-end encrypted', 'No server storage', 'Resumable transfers', 'Live presence', 'Password protection']

export default function WelcomePage(): React.ReactElement {
  return (
    <Box>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatedBackground />
        <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <ZyncIcon size={72} />
            <Chip label="Welcome aboard 🎉" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
            <Typography variant="h2" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3rem' } }}>
              Welcome to{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {brand.name}
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 620 }}>
              The fastest, most private way to send files — straight from your
              browser to theirs, with no size limits and nothing left behind.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <Button component={ViewTransitionLink} href="/login?mode=signup" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                Create your free account
              </Button>
              <Button component={ViewTransitionLink} href="/send" variant="outlined" size="large">
                Send a file
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center', pt: 2 }}>
              {PERKS.map((p) => (
                <Chip key={p} label={p} size="small" variant="outlined" />
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h2" sx={{ fontWeight: 800, textAlign: 'center', mb: 6 }}>
          Up and running in four steps
        </Typography>
        <Grid container spacing={3}>
          {STEPS.map((s) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.n}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, mb: 2 }}>
                    {s.n}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.body}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
