'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import UploadZone from '../../components/transfer/UploadZone'
import UploadProgress, { FileProgress } from '../../components/transfer/UploadProgress'
import ShareCard from '../../components/transfer/ShareCard'

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export default function TransferPage(): React.ReactElement {
  const [files, setFiles] = React.useState<File[]>([])
  const [title, setTitle] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [expiryDays, setExpiryDays] = React.useState(7)
  const [limitDownloads, setLimitDownloads] = React.useState(false)
  const [maxDownloads, setMaxDownloads] = React.useState(5)
  const [recipientInput, setRecipientInput] = React.useState('')
  const [recipientEmails, setRecipientEmails] = React.useState<string[]>([])
  const [notifyMe, setNotifyMe] = React.useState(false)
  const [notifyEmail, setNotifyEmail] = React.useState('')
  const [burnAfterRead, setBurnAfterRead] = React.useState(false)
  const [stage, setStage] = React.useState<Stage>('idle')
  const [fileProgress, setFileProgress] = React.useState<FileProgress[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [resultSlug, setResultSlug] = React.useState('')
  const [resultExpiry, setResultExpiry] = React.useState('')
  const [resultTitle, setResultTitle] = React.useState('')
  const [resultBurn, setResultBurn] = React.useState(false)

  const totalSize = files.reduce((s, f) => s + f.size, 0)
  const overLimit = totalSize > 2 * 1024 * 1024 * 1024

  const addRecipient = () => {
    const emails = recipientInput
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    const unique = [...new Set([...recipientEmails, ...emails])]
    setRecipientEmails(unique.slice(0, 20))
    setRecipientInput('')
  }

  const removeRecipient = (email: string) => {
    setRecipientEmails((prev) => prev.filter((e) => e !== email))
  }

  const upload = async () => {
    if (files.length === 0 || overLimit) return
    setStage('uploading')
    setError(null)
    setFileProgress(files.map((f) => ({ name: f.name, progress: 0, done: false, error: false })))

    try {
      const createRes = await fetch('/api/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          title,
          message,
          password: password || undefined,
          expiryDays,
          maxDownloads: limitDownloads ? maxDownloads : null,
          notifyEmail: notifyMe && notifyEmail ? notifyEmail : undefined,
          recipientEmails,
          burnAfterRead,
        }),
      })
      if (!createRes.ok) {
        const json = await createRes.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to create transfer.')
      }
      const { slug, uploadUrls, expiresAt } = await createRes.json()

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
          }),
        ),
      )

      await fetch('/api/transfer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      setResultSlug(slug)
      setResultExpiry(expiresAt)
      setResultTitle(title)
      setResultBurn(burnAfterRead)
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
    setTitle('')
    setMessage('')
    setPassword('')
    setExpiryDays(7)
    setLimitDownloads(false)
    setMaxDownloads(5)
    setRecipientEmails([])
    setRecipientInput('')
    setNotifyMe(false)
    setNotifyEmail('')
    setBurnAfterRead(false)
    setStage('idle')
    setFileProgress([])
    setError(null)
    setResultSlug('')
    setResultExpiry('')
    setResultTitle('')
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
          <Chip label="20 files per transfer" size="small" />
          <Chip label="Zero egress fees" size="small" />
          <Chip label="30-day links when signed in" size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {stage === 'done' ? (
            <Stack spacing={3}>
              <ShareCard slug={resultSlug} expiresAt={resultExpiry} title={resultTitle} burnAfterRead={resultBurn} />
              <Button variant="outlined" onClick={reset}>
                Send another transfer
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <UploadZone files={files} onChange={setFiles} disabled={stage === 'uploading'} />

              {stage === 'uploading' && (
                <UploadProgress files={fileProgress} overallProgress={overallProgress} />
              )}

              {stage !== 'uploading' && files.length > 0 && (
                <>
                  <Divider />

                  {/* Title */}
                  <TextField
                    label="Transfer name (optional)"
                    placeholder="e.g. Project files, Holiday photos…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                    size="small"
                    fullWidth
                  />

                  {/* Message */}
                  <TextField
                    label="Message to recipient (optional)"
                    multiline
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                    helperText={`${message.length}/1000`}
                    size="small"
                    fullWidth
                  />

                  {/* Advanced options accordion */}
                  <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Options
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2.5}>
                        {/* Expiry */}
                        <FormControl size="small" fullWidth>
                          <InputLabel>Link expires after</InputLabel>
                          <Select
                            value={expiryDays}
                            label="Link expires after"
                            onChange={(e) => setExpiryDays(Number(e.target.value))}
                          >
                            <MenuItem value={1}>1 day</MenuItem>
                            <MenuItem value={3}>3 days</MenuItem>
                            <MenuItem value={7}>7 days</MenuItem>
                            <MenuItem value={14}>14 days (sign in required)</MenuItem>
                            <MenuItem value={30}>30 days (sign in required)</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Password */}
                        <TextField
                          label="Password protect (optional)"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          size="small"
                          fullWidth
                          slotProps={{
                            htmlInput: { maxLength: 200 },
                            input: {
                              endAdornment: (
                                <IconButton
                                  size="small"
                                  onClick={() => setShowPassword((p) => !p)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              ),
                            },
                          }}
                          helperText="Recipients must enter this password to download"
                        />

                        {/* Download limit */}
                        <Stack spacing={1}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={limitDownloads}
                                onChange={(e) => setLimitDownloads(e.target.checked)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">Limit number of downloads</Typography>}
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

                        {/* Send to recipients */}
                        <Stack spacing={1}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Send link via email (optional)
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              label="Recipient email"
                              value={recipientInput}
                              onChange={(e) => setRecipientInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault()
                                  addRecipient()
                                }
                              }}
                              size="small"
                              fullWidth
                              helperText="Press Enter or comma to add multiple"
                            />
                            <Button variant="outlined" onClick={addRecipient} sx={{ minWidth: 0, px: 2 }}>
                              <AddIcon fontSize="small" />
                            </Button>
                          </Stack>
                          {recipientEmails.length > 0 && (
                            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              {recipientEmails.map((email) => (
                                <Chip
                                  key={email}
                                  label={email}
                                  size="small"
                                  onDelete={() => removeRecipient(email)}
                                  deleteIcon={<CloseIcon />}
                                />
                              ))}
                            </Stack>
                          )}
                        </Stack>

                        {/* Burn after read */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={burnAfterRead}
                              onChange={(e) => setBurnAfterRead(e.target.checked)}
                              size="small"
                              color="error"
                            />
                          }
                          label={
                            <Stack>
                              <Typography variant="body2">Delete files after first download</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Files are permanently removed 30 s after the first download starts
                              </Typography>
                            </Stack>
                          }
                        />

                        {/* Notify me on download */}
                        <Stack spacing={1}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={notifyMe}
                                onChange={(e) => setNotifyMe(e.target.checked)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">Notify me when downloaded</Typography>}
                          />
                          <Collapse in={notifyMe}>
                            <TextField
                              label="Your email"
                              type="email"
                              value={notifyEmail}
                              onChange={(e) => setNotifyEmail(e.target.value)}
                              size="small"
                              fullWidth
                            />
                          </Collapse>
                        </Stack>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
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
                  stage === 'uploading' ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <CloudUploadIcon />
                  )
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
