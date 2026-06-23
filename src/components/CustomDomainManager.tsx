'use client'

import * as React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'

type DomainRecord = {
  userId: string
  domain: string
  verificationToken: string
  verified: boolean
  verifiedAt: string | null
  createdAt: string
}

export default function CustomDomainManager(): React.ReactElement {
  const [record, setRecord] = React.useState<DomainRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [domain, setDomain] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [verifying, setVerifying] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [snack, setSnack] = React.useState('')

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/custom-domain')
        if (res.ok) {
          const json = await res.json()
          setRecord(json.domain)
          if (json.domain) setDomain(json.domain.domain)
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
    if (!cleaned) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/custom-domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned }),
      })
      const json = await res.json()
      if (res.ok) {
        setRecord(json.domain)
        setSnack('Domain saved. Add the TXT record and click Verify.')
      } else {
        setError(json.error ?? 'Failed to save domain.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const verify = async () => {
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/custom-domain/verify', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setRecord(json.domain)
        if (json.verified) {
          setSnack('Domain verified!')
        } else {
          setError(
            'TXT record not found yet. DNS propagation can take up to 24 hours. Try again shortly.',
          )
        }
      } else {
        setError(json.error ?? 'Verification failed.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setVerifying(false)
    }
  }

  const remove = async () => {
    setRemoving(true)
    try {
      const res = await fetch('/api/custom-domain', { method: 'DELETE' })
      if (res.ok) {
        setRecord(null)
        setDomain('')
        setSnack('Custom domain removed.')
      } else {
        const json = await res.json()
        setSnack(json.error ?? 'Failed to remove.')
      }
    } catch {
      setSnack('Network error.')
    } finally {
      setRemoving(false)
    }
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setSnack('Copied.')
  }

  if (loading) return <CircularProgress size={24} />

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Custom Domain
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use your own domain for transfer links (e.g.,{' '}
          <Box
            component="code"
            sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}
          >
            files.yourcompany.com
          </Box>
          ).
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Domain input */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          label="Your domain"
          placeholder="files.yourcompany.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { maxLength: 253 } }}
        />
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || !domain.trim()}
          sx={{ flexShrink: 0 }}
        >
          {saving ? (
            <CircularProgress size={18} />
          ) : record ? (
            'Update'
          ) : (
            'Add domain'
          )}
        </Button>
      </Stack>

      {/* Verification steps */}
      {record && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {record.domain}
                </Typography>
                {record.verified ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Verified"
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<PendingIcon />}
                    label="Pending verification"
                    size="small"
                    color="warning"
                  />
                )}
              </Stack>

              {!record.verified && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Add this TXT record to your DNS to verify ownership:
                  </Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack spacing={0.75}>
                        {[
                          { label: 'Type', value: 'TXT' },
                          { label: 'Host / Name', value: record.domain },
                          { label: 'Value', value: record.verificationToken },
                          { label: 'TTL', value: '3600 (or auto)' },
                        ].map(({ label, value }) => (
                          <Stack
                            key={label}
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ width: 100, flexShrink: 0 }}
                            >
                              {label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                flex: 1,
                                wordBreak: 'break-all',
                              }}
                            >
                              {value}
                            </Typography>
                            {label === 'Value' && (
                              <Button
                                size="small"
                                startIcon={
                                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                                }
                                onClick={() => copy(value)}
                                sx={{ flexShrink: 0 }}
                              >
                                Copy
                              </Button>
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Alert severity="info" sx={{ py: 0.5 }}>
                    After adding the TXT record, click Verify. DNS changes can
                    take up to 24 hours to propagate.
                  </Alert>

                  <Button
                    variant="outlined"
                    onClick={verify}
                    disabled={verifying}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {verifying ? (
                      <CircularProgress size={18} sx={{ mr: 1 }} />
                    ) : null}
                    Verify DNS
                  </Button>
                </>
              )}

              {record.verified && (
                <>
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    Domain verified on{' '}
                    {new Date(record.verifiedAt!).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    .
                  </Alert>
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    To serve transfers from this domain, add a CNAME record
                    pointing{' '}
                    <Box
                      component="code"
                      sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}
                    >
                      {record.domain}
                    </Box>{' '}
                    to{' '}
                    <Box
                      component="code"
                      sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}
                    >
                      videodownloaders.cloud
                    </Box>{' '}
                    and contact support to complete the SSL setup.
                  </Alert>
                </>
              )}

              <Button
                size="small"
                color="error"
                onClick={remove}
                disabled={removing}
                sx={{ alignSelf: 'flex-start' }}
              >
                {removing ? (
                  <CircularProgress size={16} sx={{ mr: 0.5 }} />
                ) : null}
                Remove domain
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Stack>
  )
}
