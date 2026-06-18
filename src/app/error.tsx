'use client'

import * as React from 'react'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { ZyncIcon } from '../components/Logo'

// Route-level error boundary. Keeps the app resilient in production: a thrown
// error renders this instead of a blank screen, with a retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.ReactElement {
  React.useEffect(() => {
    console.error('[Zync] route error:', error)
  }, [error])

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
      <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <ZyncIcon size={56} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Something went wrong
        </Typography>
        <Typography color="text.secondary">
          An unexpected error occurred. You can try again, or head back home.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={reset}>
            Try again
          </Button>
          <Button variant="outlined" href="/">
            Go home
          </Button>
        </Stack>
        {error.digest && (
          <Typography variant="caption" color="text.disabled">
            Ref: {error.digest}
          </Typography>
        )}
      </Stack>
    </Container>
  )
}
