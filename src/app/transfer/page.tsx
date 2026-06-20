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
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import UploadZone from '../../components/transfer/UploadZone'
import UploadProgress, { FileProgress } from '../../components/transfer/UploadProgress'
import ShareCard from '../../components/transfer/ShareCard'

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export default function TransferPage(): React.ReactElement {
  const [files, setFiles] = React.useState<File[]>([])
  const [message, setMessage] = React.useState('')
  const [limitDownloads, setLimitDownloads] = React.useState(false)
  const [maxDownloads, setMaxDownloads] = React.useState(5)
  const [stage, setStage] = React.useState<Stage>('idle')
  const [fileProgress, setFileProgress] = React.useState<FileProgress[]>([])
  const [error, setError] = React.useState<string | null>(null)

  // Set after upload completes
  const [resultSlug, setResultSlug] = React.useState('')
  const [resultExpiry, setResultExpiry] = React.useState('')

  const totalSize = files.reduce((s, f) => s + f.size, 0)
  const overLimit = totalSize > 2 * 1024 * 1024 * 1024

  const upload = async () => {
    if (files.length === 0 || overLimit) return
    setStage('uploading')
    setError(null)
    setFileProgress(files.map((f) => ({ name: f.name, progress: 0, done: false, error: false })))

    try {
      // 1. Create transfer, get presigned URLs
      const createRes = await fetch('/api/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          message,
          maxDownloads: limitDownloads ? maxDownloads : null,
        }),
      })
      if (!createRes.ok) {
        const json = await createRes.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to create transfer.')
      }
      const { slug, uploadUrls, expiresAt } = await createRes.json()

      // 2. Upload each file directly to R2 via presigned PUT
      await Promise.all(
        files.map((file, i) =>
          new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', uploadUrls[i])
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const pct = (e.loaded / e.total) * 100
                setFileProgress((prev) => {
                  const next = [...prev]
                  next[i] = { ...next[i], progress: pct }
                  return next
                })
              }
            })
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setFileProgress((prev) => {
                  const next = [...prev]
                  next[i] = { ...next[i], progress: 100, done: true }
                  return next
                })
                resolve()
              } else {
                setFileProgress((prev) => {
                  const next = [...prev]
                  next[i] = { ...next[i], error: true }
                  return next
                })
                reject(new Error(`Upload failed for ${file.name}`))
              }
            })
            xhr.addEventListener('error', () => {
              setFileProgress((prev) => {
                const next = [...prev]
                next[i] = { ...next[i], error: true }
                return next
              })
              reject(new Error(`Network error uploading ${file.name}`))
            })
            xhr.send(file)
          })
        )
      )

      // 3. Mark transfer as complete
      await fetch('/api/transfer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      setResultSlug(slug)
      setResultExpiry(expiresAt)
      setStage('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setStage('error')
    }
  }

  const overallProgress =
    fileProgress.length === 0
      ? 0
      : fileProgress.reduce((s, f) => s + f.progress, 0) / fileProgress.length

  const reset = () => {
    setFiles([])
    setMessage('')
    setLimitDownloads(false)
    setMaxDownloads(5)
    setStage('idle')
    setFileProgress([])
    setError(null)
    setResultSlug('')
    setResultExpiry('')
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={1} sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Send files
        </Typography>
        <Typography color="text.secondary">
          Upload files and share a link — no account needed, always free.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip label="Up to 2 GB" size="small" />
          <Chip label="7-day links" size="small" />
          <Chip label="End-to-end via R2" size="small" />
          <Chip label="30-day links when signed in" size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {stage === 'done' ? (
            <Stack spacing={3}>
              <ShareCard slug={resultSlug} expiresAt={resultExpiry} />
              <Button variant="outlined" onClick={reset}>
                Send another transfer
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <UploadZone
                files={files}
                onChange={setFiles}
                disabled={stage === 'uploading'}
              />

              {stage === 'uploading' && (
                <UploadProgress
                  files={fileProgress}
                  overallProgress={overallProgress}
                />
              )}

              {stage !== 'uploading' && files.length > 0 && (
                <>
                  <Divider />

                  <TextField
                    label="Message to recipient (optional)"
                    multiline
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                    helperText={`${message.length}/500`}
                    size="small"
                    fullWidth
                  />

                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={limitDownloads}
                          onChange={(e) => setLimitDownloads(e.target.checked)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Limit number of downloads
                        </Typography>
                      }
                    />
                    <Collapse in={limitDownloads}>
                      <TextField
                        type="number"
                        label="Max downloads"
                        value={maxDownloads}
                        onChange={(e) => setMaxDownloads(Math.max(1, Number(e.target.value)))}
                        size="small"
                        slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                        sx={{ width: 160 }}
                      />
                    </Collapse>
                  </Stack>
                </>
              )}

              {error && <Alert severity="error">{error}</Alert>}
              {overLimit && (
                <Alert severity="warning">Total size exceeds the 2 GB limit.</Alert>
              )}

              <Button
                variant="contained"
                size="large"
                startIcon={
                  stage === 'uploading'
                    ? <CircularProgress size={18} color="inherit" />
                    : <CloudUploadIcon />
                }
                onClick={upload}
                disabled={files.length === 0 || overLimit || stage === 'uploading'}
                fullWidth
              >
                {stage === 'uploading' ? 'Uploading…' : 'Upload & get link'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                By uploading you agree to our{' '}
                <Box component="a" href="/acceptable-use" sx={{ color: 'inherit' }}>
                  Acceptable Use Policy
                </Box>
                . Files are stored on Cloudflare R2 and automatically deleted on expiry.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
