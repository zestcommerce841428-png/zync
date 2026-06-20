'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import QRCode from 'react-qr-code'

type Props = {
  slug: string
  expiresAt: string
}

export default function ShareCard({ slug, expiresAt }: Props): React.ReactElement {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer/${slug}`
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const expiry = new Date(expiresAt)
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)

  return (
    <Stack spacing={2}>
      <Alert severity="success" icon={<CheckIcon />}>
        Your files are ready to share!
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, flexShrink: 0 }}>
          <QRCode value={url} size={112} />
        </Box>
        <Stack spacing={1} sx={{ flex: 1, width: '100%' }}>
          <TextField
            value={url}
            size="small"
            fullWidth
            slotProps={{ input: { readOnly: true } }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="contained"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={copy}
            color={copied ? 'success' : 'primary'}
            fullWidth
          >
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Link expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} ({expiry.toLocaleDateString()}).
        {daysLeft <= 7 ? ' Sign in to get 30-day links.' : ''}
      </Typography>
    </Stack>
  )
}
