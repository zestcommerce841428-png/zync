'use client'

import React, { JSX, useCallback, useEffect } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { UploadedFile, UploaderConnectionStatus } from '../types'
import { useWebRTCPeer } from './WebRTCProvider'
import QRCode from 'react-qr-code'
import Loading from './Loading'
import StopButton from './StopButton'
import { useUploaderChannel } from '../hooks/useUploaderChannel'
import { useUploaderConnections } from '../hooks/useUploaderConnections'
import { CopyableInput } from './CopyableInput'
import { ConnectionListItem } from './ConnectionListItem'
import { ErrorMessage } from './ErrorMessage'
import { setRotating } from '../hooks/useRotatingSpinner'

const QR_CODE_SIZE = 128

export default function Uploader({
  files,
  password,
  onStop,
}: {
  files: UploadedFile[]
  password: string
  onStop: () => void
}): JSX.Element {
  const { peer, stop } = useWebRTCPeer()
  const { isLoading, error, longSlug, shortSlug, longURL, shortURL } =
    useUploaderChannel(peer.id)
  const connections = useUploaderConnections(peer, files, password)

  const handleStop = useCallback(() => {
    stop()
    onStop()
  }, [stop, onStop])

  const activeDownloaders = connections.filter(
    (conn) => conn.status === UploaderConnectionStatus.Uploading,
  ).length

  useEffect(() => {
    setRotating(activeDownloaders > 0)
  }, [activeDownloaders])

  if (isLoading || !longSlug || !shortSlug) {
    return <Loading text="Creating channel..." />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
        <Box sx={{ flex: 'none', bgcolor: '#fff', p: 1, borderRadius: 1 }}>
          <QRCode value={shortURL ?? ''} size={QR_CODE_SIZE} />
        </Box>
        <Stack spacing={1} sx={{ justifyContent: 'center', flex: 'auto' }}>
          <CopyableInput label="Long URL" value={longURL ?? ''} />
          <CopyableInput label="Short URL" value={shortURL ?? ''} />
        </Stack>
      </Stack>

      <Divider sx={{ mt: 3, mb: 2 }} />

      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {activeDownloaders} Downloading, {connections.length} Total
        </Typography>
        <StopButton onClick={handleStop} />
      </Stack>

      {connections.map((conn, i) => (
        <ConnectionListItem key={i} conn={conn} />
      ))}
    </Box>
  )
}
