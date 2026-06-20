import * as React from 'react'
import type { Metadata } from 'next'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { ZyncIcon } from '../../../components/Logo'
import DownloadCard from '../../../components/transfer/DownloadCard'
import { getTransfer } from '../../../lib/transfer'
import { brand } from '../../../brand'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const t = await getTransfer(slug)
  if (!t || !t.completed) return { title: 'Transfer not found' }
  const label = t.title || `${t.files.length} file${t.files.length !== 1 ? 's' : ''}`
  return {
    title: `Download ${label} · ${brand.name}`,
    description: t.message || `${t.files.length} file(s) shared via ${brand.name}`,
  }
}

export default async function TransferDownloadPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params
  const transfer = await getTransfer(slug)
  const expired = transfer && new Date(transfer.expiresAt) < new Date()

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ZyncIcon size={40} />
              <Stack>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  Secure file transfer
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Powered by {brand.name}
                </Typography>
              </Stack>
            </Stack>

            {!transfer || !transfer.completed || expired ? (
              <Alert severity="error">
                This transfer link is invalid or has expired.
              </Alert>
            ) : (
              <DownloadCard
                slug={transfer.slug}
                files={transfer.files.map(({ name, size, type }) => ({ name, size, type }))}
                totalSize={transfer.totalSize}
                expiresAt={transfer.expiresAt}
                title={transfer.title}
                message={transfer.message}
                downloadCount={transfer.downloadCount}
                maxDownloads={transfer.maxDownloads}
                passwordProtected={!!transfer.passwordHash}
                burnAfterRead={!!transfer.burnAfterRead}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
