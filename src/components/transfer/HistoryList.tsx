'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import LinkIcon from '@mui/icons-material/Link'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LockIcon from '@mui/icons-material/Lock'
import FolderIcon from '@mui/icons-material/Folder'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

type TransferSummary = {
  slug: string
  title: string
  message: string
  fileCount: number
  totalSize: number
  expiresAt: string
  expiryDays: number
  downloadCount: number
  maxDownloads: number | null
  passwordProtected: boolean
  createdAt: string
}

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

export default function HistoryList(): React.ReactElement {
  const [transfers, setTransfers] = React.useState<TransferSummary[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<Set<string>>(new Set())
  const [copied, setCopied] = React.useState<string | null>(null)
  const [snackbar, setSnackbar] = React.useState('')

  React.useEffect(() => {
    fetch('/api/transfer/history')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load transfers.')
        return r.json()
      })
      .then(setTransfers)
      .catch((e) => setError(e.message))
  }, [])

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/transfer/${slug}`)
      setCopied(slug)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const handleDelete = async (slug: string) => {
    setDeleting((prev) => new Set(prev).add(slug))
    try {
      const res = await fetch(`/api/transfer/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        setTransfers((prev) => prev?.filter((t) => t.slug !== slug) ?? null)
        setSnackbar('Transfer deleted and files removed.')
      } else {
        const json = await res.json().catch(() => ({}))
        setSnackbar(json.error ?? 'Failed to delete.')
      }
    } catch {
      setSnackbar('Network error.')
    } finally {
      setDeleting((prev) => { const next = new Set(prev); next.delete(slug); return next })
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>My transfers</Typography>
          <Typography color="text.secondary">
            Active transfers you've sent — files are deleted automatically when they expire.
          </Typography>
        </Stack>
        <Button variant="contained" href="/transfer">New transfer</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {transfers === null && !error && (
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Stack>
      )}

      {transfers !== null && transfers.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2} sx={{ alignItems: 'center', py: 4 }}>
              <FolderIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography color="text.secondary">No active transfers yet.</Typography>
              <Button variant="contained" href="/transfer">Send your first transfer</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {transfers !== null && transfers.length > 0 && (
        <Stack spacing={2}>
          {transfers.map((t) => {
            const daysLeft = Math.ceil((new Date(t.expiresAt).getTime() - Date.now()) / 86400000)
            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer/${t.slug}`
            return (
              <Card key={t.slug} variant="outlined">
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                          {t.title || `Transfer ${t.slug}`}
                        </Typography>
                        {t.message && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {t.message}
                          </Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title="Open download page">
                          <IconButton size="small" component="a" href={url} target="_blank" rel="noopener">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={copied === t.slug ? 'Copied!' : 'Copy link'}>
                          <IconButton
                            size="small"
                            onClick={() => copyLink(t.slug)}
                            color={copied === t.slug ? 'success' : 'default'}
                          >
                            {copied === t.slug ? <CheckIcon fontSize="small" /> : <LinkIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete transfer and files">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(t.slug)}
                            disabled={deleting.has(t.slug)}
                          >
                            {deleting.has(t.slug) ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={daysLeft > 0 ? `${daysLeft}d left` : 'Expiring soon'}
                        size="small"
                        color={daysLeft <= 2 ? 'warning' : 'default'}
                      />
                      <Chip
                        label={`${t.fileCount} file${t.fileCount !== 1 ? 's' : ''} · ${formatBytes(t.totalSize)}`}
                        size="small"
                      />
                      <Chip
                        label={`${t.downloadCount}${t.maxDownloads ? `/${t.maxDownloads}` : ''} download${t.downloadCount !== 1 ? 's' : ''}`}
                        size="small"
                        color={t.maxDownloads !== null && t.downloadCount >= t.maxDownloads ? 'error' : 'default'}
                      />
                      {t.passwordProtected && (
                        <Chip icon={<LockIcon />} label="Password" size="small" color="info" />
                      )}
                    </Stack>

                    <Divider />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                        {url}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={copied === t.slug ? <CheckIcon /> : <LinkIcon />}
                        onClick={() => copyLink(t.slug)}
                        color={copied === t.slug ? 'success' : 'inherit'}
                        sx={{ flexShrink: 0 }}
                      >
                        {copied === t.slug ? 'Copied!' : 'Copy'}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Container>
  )
}
