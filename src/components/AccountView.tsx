'use client'

import * as React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LogoutIcon from '@mui/icons-material/Logout'
import { getSupabaseBrowserClient } from '../supabase/client'

export default function AccountView({
  email,
  name,
  avatarUrl,
  isAdmin,
}: {
  email: string
  name: string
  avatarUrl: string | null
  isAdmin: boolean
}): React.ReactElement {
  const [avatar, setAvatar] = React.useState(avatarUrl)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const onPick = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      setAvatar(data.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase?.auth.signOut()
    window.location.href = '/'
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Avatar src={avatar || undefined} sx={{ width: 96, height: 96, fontSize: 36 }}>
            {name?.[0]?.toUpperCase() || email[0]?.toUpperCase()}
          </Avatar>
          <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {name || 'Zync user'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
            {isAdmin && <Chip label="Super Admin" color="primary" size="small" sx={{ mt: 0.5 }} />}
          </Stack>

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={onPick}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={18} /> : <PhotoCameraIcon />}
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={signOut}>
              Sign out
            </Button>
          </Stack>

          {isAdmin && (
            <Button href="/admin" variant="text">
              Go to admin dashboard →
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
