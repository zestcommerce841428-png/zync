'use client'

import React, { JSX, useCallback, useState, useMemo } from 'react'
import Stack from '@mui/material/Stack'
import WebRTCPeerProvider from './WebRTCProvider'
import DropZone from './DropZone'
import UploadFileList from './UploadFileList'
import Uploader from './Uploader'
import PasswordField from './PasswordField'
import StartButton from './StartButton'
import { UploadedFile } from '../types'
import TransferSpinner from './TransferSpinner'
import CancelButton from './CancelButton'
import { getFileName } from '../fs'
import TitleText from './TitleText'
import SubtitleText from './SubtitleText'
import { pluralize } from '../utils/pluralize'
import TermsAcceptance from './TermsAcceptance'
import AddFilesButton from './AddFilesButton'
import { brand } from '../brand'

function PageWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Stack
      spacing={2.5}
      sx={{ alignItems: 'center', py: 5, px: 2, maxWidth: 672, mx: 'auto', width: '100%' }}
    >
      <TransferSpinner direction="up" />
      {children}
    </Stack>
  )
}

function InitialState({
  onDrop,
}: {
  onDrop: (files: UploadedFile[]) => void
}): JSX.Element {
  return (
    <PageWrapper>
      <Stack sx={{ alignItems: 'center', maxWidth: 448 }}>
        <TitleText>Drop a file to beam it straight to another browser.</TitleText>
      </Stack>
      <DropZone onDrop={onDrop} />
      <TermsAcceptance />
    </PageWrapper>
  )
}

function useUploaderFileListData(uploadedFiles: UploadedFile[]) {
  return useMemo(() => {
    return uploadedFiles.map((item) => ({
      fileName: getFileName(item),
      type: item.type,
    }))
  }, [uploadedFiles])
}

function ConfirmUploadState({
  uploadedFiles,
  password,
  onChangePassword,
  onCancel,
  onStart,
  onRemoveFile,
  onAddFiles,
}: {
  uploadedFiles: UploadedFile[]
  password: string
  onChangePassword: (pw: string) => void
  onCancel: () => void
  onStart: () => void
  onRemoveFile: (index: number) => void
  onAddFiles: (files: UploadedFile[]) => void
}): JSX.Element {
  const fileListData = useUploaderFileListData(uploadedFiles)
  return (
    <PageWrapper>
      <TitleText>
        You are about to start uploading{' '}
        {pluralize(uploadedFiles.length, 'file', 'files')}.{' '}
        <AddFilesButton onAdd={onAddFiles} />
      </TitleText>
      <UploadFileList files={fileListData} onRemove={onRemoveFile} />
      <PasswordField value={password} onChange={onChangePassword} />
      <Stack direction="row" spacing={2}>
        <CancelButton onClick={onCancel} />
        <StartButton onClick={onStart} />
      </Stack>
    </PageWrapper>
  )
}

function UploadingState({
  uploadedFiles,
  password,
  onStop,
}: {
  uploadedFiles: UploadedFile[]
  password: string
  onStop: () => void
}): JSX.Element {
  const fileListData = useUploaderFileListData(uploadedFiles)
  return (
    <PageWrapper>
      <TitleText>
        You are uploading {pluralize(uploadedFiles.length, 'file', 'files')}.
      </TitleText>
      <SubtitleText>
        Leave this tab open. {brand.name} never stores your files.
      </SubtitleText>
      <UploadFileList files={fileListData} />
      <WebRTCPeerProvider>
        <Uploader files={uploadedFiles} password={password} onStop={onStop} />
      </WebRTCPeerProvider>
    </PageWrapper>
  )
}

export default function SendApp(): JSX.Element {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [password, setPassword] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleDrop = useCallback((files: UploadedFile[]): void => {
    setUploadedFiles(files)
  }, [])
  const handleChangePassword = useCallback((pw: string) => setPassword(pw), [])
  const handleStart = useCallback(() => setUploading(true), [])
  const handleStop = useCallback(() => setUploading(false), [])
  const handleCancel = useCallback(() => {
    setUploadedFiles([])
    setUploading(false)
  }, [])
  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((fs) => fs.filter((_, i) => i !== index))
  }, [])
  const handleAddFiles = useCallback((files: UploadedFile[]) => {
    setUploadedFiles((fs) => [...fs, ...files])
  }, [])

  if (!uploadedFiles.length) {
    return <InitialState onDrop={handleDrop} />
  }

  if (!uploading) {
    return (
      <ConfirmUploadState
        uploadedFiles={uploadedFiles}
        password={password}
        onChangePassword={handleChangePassword}
        onCancel={handleCancel}
        onStart={handleStart}
        onRemoveFile={handleRemoveFile}
        onAddFiles={handleAddFiles}
      />
    )
  }

  return (
    <UploadingState
      uploadedFiles={uploadedFiles}
      password={password}
      onStop={handleStop}
    />
  )
}
