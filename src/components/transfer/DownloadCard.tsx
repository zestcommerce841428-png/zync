'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import DownloadIcon from '@mui/icons-material/Download'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

type FileInfo = { name: string; size: number; type: string }

type Props = {
  slug: string
  files: FileInfo[]
  totalSize: number
  expiresAt: string
  message: string
  downloadCount: number
  maxDownloads: number | null
}

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

export default function DownloadCard({
  slug,
  files,
  totalSize,
  expiresAt,
  message,
  downloadCount,
  maxDownloads,
}: Props): React.ReactElement {
  const [downloading, setDownloading] = React.useState<Set<number>>(new Set())
  const [zipping, setZipping] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => { setNow(Date.now()) }, [])
  const expiry = new Date(expiresAt)
  const daysLeft = now !== null ? Math.ceil((expiry.getTime() - now) / 86400000) : null
  const expired = daysLeft !== null && daysLeft <= 0

  const downloadFile = async (index: number) => {
    setDownloading((prev) => new Set(prev).add(index))
    setError(null)
    try {
      const res = await fetch(`/api/transfer/${slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIndex: index }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Download failed.')
        return
      }
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = files[index].name
      a.click()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }
  }

  const downloadAll = async () => {
    if (files.length === 1) {
      await downloadFile(0)
      return
    }

    setZipping(true)
    setError(null)
    try {
      const { Zip, AsyncZipDeflate } = await import('fflate')
      const zipChunks: Uint8Array[] = []

      await new Promise<void>((resolve, reject) => {
        const zip = new Zip((err, chunk, final) => {
          if (err) { reject(err); return }
          zipChunks.push(chunk)
          if (final) resolve()
        })

        let pending = files.length
        const finish = () => { if (--pending === 0) zip.end() }

        files.forEach(async (f, i) => {
          const res = await fetch(`/api/transfer/${slug}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIndex: i }),
          })
          if (!res.ok) { reject(new Error('Failed to get download URL')); return }
          const { url } = await res.json()

          const fileRes = await fetch(url)
          const buf = new Uint8Array(await fileRes.arrayBuffer())
          const entry = new AsyncZipDeflate(f.name)
          zip.add(entry)
          entry.push(buf, true)
          finish()
        })
      })

      const blob = new Blob(zipChunks, { type: 'application/zip' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `zync-transfer-${slug}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
    } catch {
      setError('Failed to create ZIP. Try downloading files individually.')
    } finally {
      setZipping(false)
    }
  }

  if (expired) {
    return <Alert severity="warning">This transfer has expired. The files have been deleted.</Alert>
  }

  return (
    <Stack spacing={2}>
      {message && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: '4px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            "{message}"
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          icon={<AccessTimeIcon />}
          label={daysLeft === null ? 'Checking expiry…' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
          size="small"
          color={daysLeft !== null && daysLeft <= 2 ? 'warning' : 'default'}
        />
        <Chip label={`${files.length} file${files.length !== 1 ? 's' : ''}`} size="small" />
        <Chip label={formatBytes(totalSize)} size="small" />
        {maxDownloads && (
          <Chip
            label={`${downloadCount}/${maxDownloads} downloads`}
            size="small"
            color={downloadCount >= maxDownloads ? 'error' : 'default'}
          />
        )}
      </Stack>

      <List disablePadding>
        {files.map((f, i) => (
          <ListItem
            key={i}
            disableGutters
            secondaryAction={
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  downloading.has(i)
                    ? <CircularProgress size={14} />
                    : <DownloadIcon />
                }
                onClick={() => downloadFile(i)}
                disabled={downloading.has(i) || zipping}
              >
                {downloading.has(i) ? 'Downloading…' : 'Download'}
              </Button>
            }
          >
            <ListItemText
              primary={f.name}
              secondary={formatBytes(f.size)}
              slotProps={{ primary: { noWrap: true, sx: { maxWidth: '55%' } } }}
            />
          </ListItem>
        ))}
      </List>

      <Button
        variant="contained"
        size="large"
        startIcon={zipping ? <CircularProgress size={18} color="inherit" /> : <FolderZipIcon />}
        onClick={downloadAll}
        disabled={zipping || downloading.size > 0}
        fullWidth
      >
        {zipping
          ? 'Creating ZIP…'
          : files.length === 1
          ? 'Download file'
          : 'Download all as ZIP'}
      </Button>
    </Stack>
  )
}
