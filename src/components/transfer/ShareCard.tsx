'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkIcon from '@mui/icons-material/Link'
import QRCode from 'react-qr-code'

type Props = {
  slug: string
  expiresAt: string
  title?: string
  passwordProtected?: boolean
  burnAfterRead?: boolean
}

export default function ShareCard({ slug, expiresAt, title, passwordProtected, burnAfterRead }: Props): React.ReactElement {
  const [origin, setOrigin] = React.useState('')
  React.useEffect(() => { setOrigin(window.location.origin) }, [])
  const url = `${origin}/transfer/${slug}`

  const [copied, setCopied] = React.useState(false)
  const [copiedDirect, setCopiedDirect] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const copyDirect = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedDirect(true)
      setTimeout(() => setCopiedDirect(false), 2000)
    } catch {
      // ignore
    }
  }

  const [daysLeft, setDaysLeft] = React.useState<number | null>(null)
  React.useEffect(() => {
    const expiry = new Date(expiresAt)
    setDaysLeft(Math.ceil((expiry.getTime() - Date.now()) / 86400000))
  }, [expiresAt])

  const expiryStr = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <Stack spacing={2}>
      <Alert severity="success" icon={<CheckIcon />}>
        {title ? `"${title}" is ready to share!` : 'Your files are ready to share!'}
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, flexShrink: 0, bgcolor: 'white' }}>
          {origin && <QRCode value={url} size={112} />}
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
          <Button
            variant="outlined"
            size="small"
            startIcon={copiedDirect ? <CheckIcon /> : <LinkIcon />}
            onClick={copyDirect}
            color={copiedDirect ? 'success' : 'inherit'}
            fullWidth
          >
            {copiedDirect ? 'Copied!' : 'Copy direct link'}
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {daysLeft !== null && (
          <Chip
            label={`Expires ${expiryStr} (${daysLeft}d)`}
            size="small"
            color={daysLeft <= 2 ? 'warning' : 'default'}
          />
        )}
        {passwordProtected && (
          <Chip label="Password protected" size="small" color="info" />
        )}
        {burnAfterRead && (
          <Chip label="Deletes after download" size="small" color="error" variant="outlined" />
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Anyone with this link can download the files.
        {daysLeft !== null && daysLeft <= 7 ? ' Sign in to get links up to 30 days.' : ''}
      </Typography>
    </Stack>
  )
}
