import React, { JSX } from 'react'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

export default function ProgressBar({
  value,
  max,
}: {
  value: number
  max: number
}): JSX.Element {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const isComplete = value >= max && max > 0

  return (
    <Box
      id="progress-bar"
      sx={{ position: 'relative', width: '100%', height: 48 }}
    >
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, percentage))}
        color={isComplete ? 'success' : 'primary'}
        sx={{
          height: '100%',
          borderRadius: 1.5,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1.5,
            transition: 'transform .3s ease-in-out',
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography
          id="progress-percentage"
          sx={{
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,.45)',
          }}
        >
          {Math.round(percentage)}%
        </Typography>
      </Box>
    </Box>
  )
}
