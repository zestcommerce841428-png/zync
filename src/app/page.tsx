import * as React from 'react'
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
import LockIcon from '@mui/icons-material/Lock'
import BoltIcon from '@mui/icons-material/Bolt'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import DevicesIcon from '@mui/icons-material/Devices'
import PublicIcon from '@mui/icons-material/Public'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as ViewTransitionLink } from 'next-view-transitions'
import { ZyncIcon } from '../components/Logo'
import { brand } from '../brand'

export const metadata: Metadata = {
  title: `${brand.name} • ${brand.tagline}`,
  description: brand.shortDescription,
  alternates: { canonical: '/' },
}

const FEATURES = [
  {
    icon: CloudOffIcon,
    title: 'No server storage',
    body: 'Files stream directly browser-to-browser over WebRTC. They never touch our servers, so there is nothing to leak, subpoena, or breach.',
  },
  {
    icon: LockIcon,
    title: 'Encrypted end-to-end',
    body: 'Every transfer rides on WebRTC’s mandatory DTLS encryption. Add an optional password for a second lock on the door.',
  },
  {
    icon: BoltIcon,
    title: 'Blazing fast',
    body: 'Direct peer connections mean no upload-then-download round trip. Transfers move at the speed of your network.',
  },
  {
    icon: DevicesIcon,
    title: 'Any device, any size',
    body: 'Works in any modern browser on desktop or mobile. No app install, no account, no arbitrary file-size caps.',
  },
  {
    icon: PublicIcon,
    title: 'Share with a link or QR',
    body: 'Generate a short link or scan a QR code. Multiple people can receive the same file from a single room.',
  },
  {
    icon: VpnKeyIcon,
    title: 'You stay in control',
    body: 'Set download limits, password-protect, and stop a transfer at any time. Resumable transfers survive flaky networks.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Drop your file',
    body: 'Open the sender, drag in a file (or several). Nothing uploads yet — your browser just gets ready to serve it.',
  },
  {
    n: '02',
    title: 'Share the link',
    body: 'Zync mints a short link and QR code. Send it to whoever needs the file, however you like.',
  },
  {
    n: '03',
    title: 'They download direct',
    body: 'The recipient’s browser connects straight to yours and the bytes flow peer-to-peer until it’s done.',
  },
]

function JsonLd(): React.ReactElement {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: brand.org.legalName,
        url: brand.url,
        logo: `${brand.url}/icon.svg`,
        email: brand.contact.email,
        foundingDate: String(brand.org.foundingYear),
      },
      {
        '@type': 'WebSite',
        name: brand.name,
        url: brand.url,
        description: brand.shortDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${brand.url}/blog?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: brand.name,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default function LandingPage(): React.ReactElement {
  return (
    <Box>
      <JsonLd />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(1200px 500px at 50% -10%, rgba(99,102,241,0.18), transparent), radial-gradient(900px 500px at 90% 10%, rgba(168,85,247,0.14), transparent)',
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <ZyncIcon size={72} />
            <Chip
              label="Free • Private • No sign-up"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: { xs: '2.25rem', md: '3.5rem' },
                lineHeight: 1.1,
              }}
            >
              Send files straight from{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                browser to browser
              </Box>
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 620, fontWeight: 400 }}>
              {brand.name} beams your files directly to the recipient over an
              encrypted peer-to-peer connection. No uploads, no storage, no size
              limits — they’re gone the moment you close the tab.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <Button
                component={ViewTransitionLink}
                href="/send"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
              >
                Send a file now
              </Button>
              <Button
                component={ViewTransitionLink}
                href="/#how-it-works"
                variant="outlined"
                size="large"
              >
                How it works
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" id="features" sx={{ py: { xs: 8, md: 10 }, scrollMarginTop: 80 }}>
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
            Why Zync
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
            Private by design, fast by default
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Most “file sharing” tools upload your data to a server you don’t
            control. Zync skips the middleman entirely.
          </Typography>
        </Stack>
        <Grid container spacing={3}>
          {FEATURES.map((f) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      mb: 2,
                    }}
                  >
                    <f.icon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.body}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it works */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg" id="how-it-works" sx={{ py: { xs: 8, md: 10 }, scrollMarginTop: 80 }}>
          <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              How it works
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
              Three steps, zero friction
            </Typography>
          </Stack>
          <Grid container spacing={4}>
            {STEPS.map((s) => (
              <Grid size={{ xs: 12, md: 4 }} key={s.n}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 800, color: 'primary.main', opacity: 0.25 }}
                  >
                    {s.n}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.body}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
          Ready to share something?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 560, mx: 'auto' }}>
          No account, no install, no catch. Drop a file and get a link in
          seconds.
        </Typography>
        <Button
          component={ViewTransitionLink}
          href="/send"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
        >
          Start a transfer
        </Button>
      </Container>
    </Box>
  )
}
