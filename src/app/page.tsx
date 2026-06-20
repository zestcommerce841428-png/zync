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
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ReplayIcon from '@mui/icons-material/Replay'
import SensorsIcon from '@mui/icons-material/Sensors'
import { Link as ViewTransitionLink } from 'next-view-transitions'
import { ZyncIcon } from '../components/Logo'
import AnimatedBackground from '../components/AnimatedBackground'
import FeatureSlider from '../components/FeatureSlider'
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
    body: 'Works in any modern browser on desktop or mobile. No app install and no arbitrary file-size caps — just one free account.',
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
  {
    icon: AllInclusiveIcon,
    title: 'Truly unlimited',
    body: 'No file-size caps and no upload or download limits — ever. Files are streamed and chunked with backpressure, so even multi-gigabyte transfers stay fast and memory-light.',
  },
  {
    icon: SensorsIcon,
    title: 'Live presence & status',
    body: 'See in real time when the uploader is online, how many people are viewing, and how many downloads have started — streamed over Server-Sent Events.',
  },
  {
    icon: QrCode2Icon,
    title: 'Instant QR sharing',
    body: 'Every transfer gets a scannable QR code, perfect for moving files from a computer to a phone in one tap.',
  },
  {
    icon: ReplayIcon,
    title: 'Resumable transfers',
    body: 'Dropped connection? Zync remembers the last acknowledged byte and resumes from there instead of starting over.',
  },
]

const HIGHLIGHTS: Array<{ stat: string; label: string }> = [
  { stat: '∞', label: 'Unlimited file size' },
  { stat: '0', label: 'Bytes stored on a server' },
  { stat: 'E2E', label: 'Encrypted by default' },
  { stat: '1×', label: 'One-time free sign-up' },
]

const TECH: Array<{ name: string; role: string }> = [
  {
    name: 'Next.js 16',
    role: 'App Router + Turbopack for a fast, SEO-ready frontend & API',
  },
  { name: 'React 19', role: 'Modern UI with Server Components' },
  { name: 'TypeScript', role: 'End-to-end type safety' },
  { name: 'Material UI', role: 'Accessible, themeable design system' },
  { name: 'WebRTC', role: 'Encrypted peer-to-peer data channels' },
  { name: 'PeerJS', role: 'Peer discovery & connection handling' },
  { name: 'Server-Sent Events', role: 'Real-time presence & live stats' },
  { name: 'Redis', role: 'Optional horizontal scaling & coordination' },
  { name: 'Supabase', role: 'Optional auth, Google login & storage' },
  { name: 'Zod', role: 'Runtime schema validation at the edges' },
  { name: 'Emotion', role: 'CSS-in-JS powering the theme engine' },
  { name: 'StreamSaver', role: 'Streams huge downloads straight to disk' },
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
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatedBackground />
        <Container
          maxWidth="md"
          sx={{
            py: { xs: 8, md: 12 },
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <ZyncIcon size={72} />
            <Chip
              icon={<AllInclusiveIcon />}
              label="Unlimited size • Free • Private • One-time sign-up"
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
            <Typography
              variant="h6"
              sx={{ color: 'text.secondary', maxWidth: 640, fontWeight: 400 }}
            >
              {brand.name} beams your files directly to the recipient over an
              encrypted peer-to-peer connection.{' '}
              <strong>
                No file-size caps and no upload or download limits
              </strong>{' '}
              — and nothing is stored on a server. Your files are gone the
              moment you close the tab.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ pt: 1 }}
            >
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

      {/* Highlights band */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={2}>
            {HIGHLIGHTS.map((h) => (
              <Grid size={{ xs: 6, md: 3 }} key={h.label}>
                <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {h.stat}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {h.label}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container
        maxWidth="lg"
        id="features"
        sx={{ py: { xs: 8, md: 10 }, scrollMarginTop: 80 }}
      >
        <Stack
          spacing={1}
          sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}
        >
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700 }}
          >
            Why Zync
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
            Private by design, fast by default
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 640 }}
          >
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

      {/* Rotating highlight slider */}
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <FeatureSlider />
      </Container>

      {/* How it works */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container
          maxWidth="lg"
          id="how-it-works"
          sx={{ py: { xs: 8, md: 10 }, scrollMarginTop: 80 }}
        >
          <Stack
            spacing={1}
            sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}
          >
            <Typography
              variant="overline"
              color="primary"
              sx={{ fontWeight: 700 }}
            >
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
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                      opacity: 0.25,
                    }}
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

      {/* Tech stack */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={1}
          sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}
        >
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700 }}
          >
            Under the hood
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
            Built with a modern, secure stack
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 640 }}
          >
            {brand.name} is engineered for speed, privacy and scale — every
            piece chosen to keep your data on the edge and out of a database.
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {TECH.map((t) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.name}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Container
        maxWidth="md"
        sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}
      >
        <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
          Ready to share something?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 560, mx: 'auto' }}
        >
          Create your free account once, then send unlimited files in seconds —
          no installs, no catch.
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
