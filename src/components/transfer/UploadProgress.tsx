'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

export type FileProgress = {
  name: string
  progress: number   // 0–100
  done: boolean
  error: boolean
}

type Props = {
  files: FileProgress[]
  overallProgress: number   // 0–100
}

export default function UploadProgress({ files, overallProgress }: Props): React.ReactElement {
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Uploading…
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(overallProgress)}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={overallProgress}
        sx={{ height: 8, borderRadius: 1, mb: 2 }}
      />
      <Stack spacing={1}>
        {files.map((f, i) => (
          <Box key={i}>
            <Stack direction="row" spacing={1} sx={{ mb: 0.25, alignItems: 'center' }}>
              {f.done && !f.error && (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
              {f.error && (
                <ErrorIcon fontSize="small" color="error" />
              )}
              <Typography
                variant="caption"
                noWrap
                sx={{ flex: 1, color: f.error ? 'error.main' : 'text.primary' }}
              >
                {f.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {f.done ? 'Done' : f.error ? 'Failed' : `${Math.round(f.progress)}%`}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={f.progress}
              color={f.error ? 'error' : f.done ? 'success' : 'primary'}
              sx={{ height: 4, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
