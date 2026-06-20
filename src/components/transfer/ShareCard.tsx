'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ShareIcon from '@mui/icons-material/Share'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import TwitterIcon from '@mui/icons-material/X'
import EmailIcon from '@mui/icons-material/Email'
import TelegramIcon from '@mui/icons-material/Telegram'
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
  const [canShare, setCanShare] = React.useState(false)
  React.useEffect(() => {
    setOrigin(window.location.origin)
    setCanShare(typeof navigator.share === 'function')
  }, [])
  const url = `${origin}/transfer/${slug}`
  const shareText = title ? `"${title}" — download via Zync` : 'Here are your files — download via Zync'

  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: shareText, url })
    } catch { /* user cancelled */ }
  }

  const [daysLeft, setDaysLeft] = React.useState<number | null>(null)
  React.useEffect(() => {
    const expiry = new Date(expiresAt)
    setDaysLeft(Math.ceil((expiry.getTime() - Date.now()) / 86400000))
  }, [expiresAt])

  const expiryStr = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const encoded = encodeURIComponent(url)
  const encodedText = encodeURIComponent(shareText)

  const socialLinks = [
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon fontSize="small" />,
      href: `https://wa.me/?text=${encodedText}%20${encoded}`,
      color: '#25D366',
    },
    {
      label: 'X / Twitter',
      icon: <TwitterIcon fontSize="small" />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encoded}`,
      color: '#000',
    },
    {
      label: 'Telegram',
      icon: <TelegramIcon fontSize="small" />,
      href: `https://t.me/share/url?url=${encoded}&text=${encodedText}`,
      color: '#229ED9',
    },
    {
      label: 'Email',
      icon: <EmailIcon fontSize="small" />,
      href: `mailto:?subject=${encodedText}&body=${encoded}`,
      color: undefined,
    },
  ]

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
          {canShare && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={nativeShare}
              fullWidth
            >
              Share…
            </Button>
          )}
        </Stack>
      </Stack>

      <Divider>
        <Typography variant="caption" color="text.secondary">Share via</Typography>
      </Divider>

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
        {socialLinks.map(({ label, icon, href, color }) => (
          <Tooltip key={label} title={label}>
            <IconButton
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 1,
                color: color ?? 'text.primary',
                '&:hover': { borderColor: color ?? 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              {icon}
            </IconButton>
          </Tooltip>
        ))}
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
