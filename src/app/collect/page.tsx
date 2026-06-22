'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import InboxIcon from '@mui/icons-material/Inbox'
import QRCode from 'react-qr-code'

type Stage = 'idle' | 'creating' | 'done' | 'error'

export default function CollectPage(): React.ReactElement {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [expiryDays, setExpiryDays] = React.useState(30)
  const [maxFiles, setMaxFiles] = React.useState(20)
  const [stage, setStage] = React.useState<Stage>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [resultSlug, setResultSlug] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [origin, setOrigin] = React.useState('')
  React.useEffect(() => { setOrigin(window.location.origin) }, [])

  const create = async () => {
    if (!title.trim()) return
    setStage('creating')
    setError(null)
    try {
      const res = await fetch('/api/collect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, expiryDays, maxFiles }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create.'); setStage('error'); return }
      setResultSlug(json.slug)
      setStage('done')
    } catch {
      setError('Network error. Please try again.')
      setStage('error')
    }
  }

  const collectUrl = resultSlug ? `${origin}/collect/${resultSlug}` : ''

  const copy = async () => {
    try { await navigator.clipboard.writeText(collectUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={1} sx={{ mb: 3, textAlign: 'center' }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <InboxIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Request files</Typography>
        </Stack>
        <Typography color="text.secondary">
          Create a link so others can upload files directly to you — no account needed on their end.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip label="No account needed for uploaders" size="small" />
          <Chip label="Email notification when files arrive" size="small" />
          <Chip label="Up to 365-day links" size="small" />
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {stage === 'done' ? (
            <Stack spacing={3}>
              <Alert severity="success" icon={<CheckIcon />}>
                Your file request is ready! Share this link to receive files.
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Stack sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, flexShrink: 0, bgcolor: 'white' }}>
                  {origin && <QRCode value={collectUrl} size={112} />}
                </Stack>
                <Stack spacing={1} sx={{ flex: 1, width: '100%' }}>
                  <TextField
                    value={collectUrl}
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
                    href={`/collect/${resultSlug}/received`}
                    fullWidth
                  >
                    View received files
                  </Button>
                </Stack>
              </Stack>

              <Divider />
              <Button variant="outlined" onClick={() => { setStage('idle'); setTitle(''); setDescription(''); setResultSlug('') }}>
                Create another request
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Request title *"
                placeholder="e.g. Send me your photos, Project files, Invoice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                size="small"
                fullWidth
                required
              />
              <TextField
                label="Instructions for uploaders (optional)"
                placeholder="e.g. Please send the high-resolution versions"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                size="small"
                fullWidth
                multiline
                rows={2}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Link expires after</InputLabel>
                  <Select
                    value={expiryDays}
                    label="Link expires after"
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                  >
                    <MenuItem value={7}>7 days</MenuItem>
                    <MenuItem value={14}>14 days</MenuItem>
                    <MenuItem value={30}>30 days</MenuItem>
                    <MenuItem value={90}>90 days</MenuItem>
                    <MenuItem value={180}>180 days</MenuItem>
                    <MenuItem value={365}>1 year</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Max files</InputLabel>
                  <Select
                    value={maxFiles}
                    label="Max files"
                    onChange={(e) => setMaxFiles(Number(e.target.value))}
                  >
                    <MenuItem value={1}>1 file</MenuItem>
                    <MenuItem value={5}>5 files</MenuItem>
                    <MenuItem value={10}>10 files</MenuItem>
                    <MenuItem value={20}>20 files</MenuItem>
                    <MenuItem value={50}>50 files</MenuItem>
                    <MenuItem value={100}>100 files</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Button
                variant="contained"
                size="large"
                onClick={create}
                disabled={!title.trim() || stage === 'creating'}
                startIcon={stage === 'creating' ? <CircularProgress size={18} color="inherit" /> : <InboxIcon />}
                fullWidth
              >
                {stage === 'creating' ? 'Creating…' : 'Create file request'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                You must be signed in to create a file request. Uploaders don't need an account.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
