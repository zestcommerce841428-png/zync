'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import { brand } from '../brand'

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'
const COMMIT = process.env.NEXT_PUBLIC_COMMIT_SHA || 'dev'
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || ''

function relativeBuild(iso: string): string {
  if (!iso) return 'local'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h}h ago`
  const m = Math.floor(diff / 60000)
  return m > 0 ? `${m}m ago` : 'just now'
}

// Dynamic build/status strip for the footer. Shows a live operational pulse,
// app version, commit, build age and runtime, with details on hover.
export default function BuildInfo(): React.ReactElement {
  const [uptime, setUptime] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setUptime((u) => u + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const dot = (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'success.main',
        boxShadow: '0 0 0 0 rgba(34,197,94,0.6)',
        animation: 'zync-pulse 2s infinite',
        '@keyframes zync-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.5)' },
          '70%': { boxShadow: '0 0 0 8px rgba(34,197,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
        },
      }}
    />
  )

  return (
    <Tooltip
      arrow
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption" sx={{ display: 'block' }}>Version: {VERSION}</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>Commit: {COMMIT}</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Built: {BUILD_TIME ? new Date(BUILD_TIME).toLocaleString() : 'local dev'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>Session: {uptime}s</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Runtime: Next.js 16 · React 19 · WebRTC
          </Typography>
        </Box>
      }
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', cursor: 'help' }}
      >
        <Chip
          size="small"
          variant="outlined"
          color="success"
          icon={<Box sx={{ ml: 1, display: 'flex' }}>{dot}</Box>}
          label="All systems operational"
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {brand.name} v{VERSION}
        </Typography>
        <Typography variant="caption" color="text.secondary">·</Typography>
        <Link
          href={`${brand.social.github}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="caption"
          underline="hover"
          color="text.secondary"
        >
          {COMMIT}
        </Link>
        <Typography variant="caption" color="text.secondary">·</Typography>
        <Typography variant="caption" color="text.secondary">
          built {relativeBuild(BUILD_TIME)}
        </Typography>
      </Stack>
    </Tooltip>
  )
}
