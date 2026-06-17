import type { Metadata } from 'next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageShell from '../../components/PageShell'
import { brand } from '../../brand'

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${brand.name} — a privacy-first, peer-to-peer file transfer tool built by ${brand.credits.author}.`,
  alternates: { canonical: '/about' },
}

const VALUES = [
  { title: 'Privacy first', body: 'We can’t lose what we never hold. Files travel directly between browsers, so your data is never parked on our servers.' },
  { title: 'Radically simple', body: 'No accounts, no installs, no dark patterns. Open the page, drop a file, share a link. That’s the whole product.' },
  { title: 'Open & honest', body: 'Transparent about how transfers work, what we store (almost nothing), and how we keep the service safe.' },
]

export default function AboutPage(): React.ReactElement {
  return (
    <PageShell
      title={`About ${brand.name}`}
      subtitle="Private, peer-to-peer file transfer for everyone."
    >
      <Typography component="p">
        {brand.name} was born from a simple frustration: sharing a file
        shouldn’t mean uploading your private data to someone else’s cloud,
        waiting for it to process, and hoping it gets deleted. Most “file
        sharing” services keep a copy of everything you send. {brand.name}{' '}
        doesn’t.
      </Typography>
      <Typography component="p">
        Instead, {brand.name} uses WebRTC to open a direct, encrypted channel
        between the sender’s browser and the recipient’s browser. The bytes flow
        straight from one device to the other. When you close the tab, the
        transfer is gone — there’s nothing left on a server to leak or subpoena.
      </Typography>

      <Box sx={{ my: 4 }}>
        <Grid container spacing={3}>
          {VALUES.map((v) => (
            <Grid size={{ xs: 12, md: 4 }} key={v.title}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {v.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {v.body}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Typography variant="h2" component="h2">
        Who builds {brand.name}
      </Typography>
      <Typography component="p">
        {brand.name} is built and maintained by{' '}
        <strong>{brand.credits.author}</strong> ({brand.credits.authorRole}),
        with engineering assistance from <strong>{brand.credits.builtWith}</strong>.
        It’s operated under {brand.org.legalName}.
      </Typography>
      <Typography component="p">
        Questions, feedback, or partnership ideas? Reach us at{' '}
        <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a> or on{' '}
        <a href={brand.contact.whatsappLink} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        .
      </Typography>
    </PageShell>
  )
}
