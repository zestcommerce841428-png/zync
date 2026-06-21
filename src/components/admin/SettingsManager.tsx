'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'

type Settings = {
  smtp_host?: string
  smtp_port?: string
  smtp_user?: string
  smtp_pass?: string
  smtp_from?: string
  r2_account_id?: string
  r2_access_key_id?: string
  r2_secret_access_key?: string
  r2_bucket_name?: string
  feature_email_notifications?: string
  feature_transfer_tracking?: string
  feature_recaptcha?: string
  feature_guest_uploads?: string
  feature_registration?: string
}

function SecretField({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helperText?: string
}) {
  const [show, setShow] = React.useState(false)
  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      fullWidth
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShow((s) => !s)}>
                {show ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

function FeatureToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: string | undefined
  onChange: (v: 'true' | 'false') => void
}) {
  const checked = value !== 'false'
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          />
        }
        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 6.5, mt: -0.5 }}>
        {description}
      </Typography>
    </Box>
  )
}

export default function SettingsManager(): React.ReactElement {
  const [tab, setTab] = React.useState(0)
  const [settings, setSettings] = React.useState<Settings>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load settings.')
      setSettings(data.settings ?? {})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const patch = (updates: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...updates }))

  const save = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed.')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error.')
    } finally {
      setSaving(false)
    }
  }

  const s = settings

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Settings
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Reload from database">
            <span>
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            onClick={save}
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveOutlinedIcon />}
            variant="contained"
            size="small"
          >
            Save all
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved. Changes take effect within 30 seconds.</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Email / SMTP" />
            <Tab label="Storage (R2)" />
            <Tab label="Features" />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={2} sx={{ maxWidth: 520 }}>
              <Typography variant="body2" color="text.secondary">
                SMTP credentials for transfer notifications. DB values override env vars — no redeploy needed.
              </Typography>
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="SMTP Host"
                  fullWidth
                  size="small"
                  value={s.smtp_host ?? ''}
                  onChange={(e) => patch({ smtp_host: e.target.value })}
                  placeholder="smtp.hostinger.com"
                />
                <TextField
                  label="Port"
                  size="small"
                  sx={{ maxWidth: 100 }}
                  value={s.smtp_port ?? ''}
                  onChange={(e) => patch({ smtp_port: e.target.value })}
                  placeholder="465"
                />
              </Stack>
              <TextField
                label="SMTP User"
                fullWidth
                size="small"
                value={s.smtp_user ?? ''}
                onChange={(e) => patch({ smtp_user: e.target.value })}
                placeholder="admin@example.com"
              />
              <SecretField
                label="SMTP Password"
                value={s.smtp_pass ?? ''}
                onChange={(v) => patch({ smtp_pass: v })}
                helperText="Leave blank (or keep '••••') to keep the current password."
              />
              <TextField
                label="From Address"
                fullWidth
                size="small"
                value={s.smtp_from ?? ''}
                onChange={(e) => patch({ smtp_from: e.target.value })}
                placeholder="Zync <noreply@example.com>"
              />
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2} sx={{ maxWidth: 520 }}>
              <Typography variant="body2" color="text.secondary">
                Cloudflare R2 credentials for file storage. Changes apply within 30 seconds.
              </Typography>
              <Divider />
              <TextField
                label="R2 Account ID"
                fullWidth
                size="small"
                value={s.r2_account_id ?? ''}
                onChange={(e) => patch({ r2_account_id: e.target.value })}
              />
              <TextField
                label="R2 Access Key ID"
                fullWidth
                size="small"
                value={s.r2_access_key_id ?? ''}
                onChange={(e) => patch({ r2_access_key_id: e.target.value })}
              />
              <SecretField
                label="R2 Secret Access Key"
                value={s.r2_secret_access_key ?? ''}
                onChange={(v) => patch({ r2_secret_access_key: v })}
              />
              <TextField
                label="R2 Bucket Name"
                fullWidth
                size="small"
                value={s.r2_bucket_name ?? ''}
                onChange={(e) => patch({ r2_bucket_name: e.target.value })}
                placeholder="zync-transfers"
              />
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
              <Typography variant="body2" color="text.secondary">
                Enable or disable features without redeploying. Takes effect within 30 seconds.
              </Typography>
              <Divider />
              <FeatureToggle
                label="Email notifications"
                description="Send transfer-sent, downloaded, and sign-in alert emails."
                value={s.feature_email_notifications}
                onChange={(v) => patch({ feature_email_notifications: v })}
              />
              <FeatureToggle
                label="Transfer tracking"
                description="Record download events (country, timestamp, hashed IP) per transfer."
                value={s.feature_transfer_tracking}
                onChange={(v) => patch({ feature_transfer_tracking: v })}
              />
              <FeatureToggle
                label="reCAPTCHA"
                description="Require reCAPTCHA v3 on upload. Disable for testing."
                value={s.feature_recaptcha}
                onChange={(v) => patch({ feature_recaptcha: v })}
              />
              <FeatureToggle
                label="Guest uploads"
                description="Allow unauthenticated users to create transfers."
                value={s.feature_guest_uploads}
                onChange={(v) => patch({ feature_guest_uploads: v })}
              />
              <FeatureToggle
                label="New registrations"
                description="Allow new users to sign up. Disable to make the site invite-only."
                value={s.feature_registration}
                onChange={(v) => patch({ feature_registration: v })}
              />
            </Stack>
          )}
        </Box>
      )}
    </Box>
  )
}
