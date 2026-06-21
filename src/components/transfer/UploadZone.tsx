'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

const MAX_FILES = 20
const MAX_BYTES = Number(process.env.NEXT_PUBLIC_TRANSFER_MAX_BYTES ?? 200 * 1024 * 1024 * 1024)

function formatBytes(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

type Props = {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export default function UploadZone({ files, onChange, disabled }: Props): React.ReactElement {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const folderElRef = React.useRef<HTMLInputElement | null>(null)
  const folderInputRef = React.useCallback((el: HTMLInputElement | null) => {
    folderElRef.current = el
    if (el) el.setAttribute('webkitdirectory', '')
  }, [])

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const merged = [...files]
    for (const f of Array.from(incoming)) {
      if (merged.length >= MAX_FILES) break
      if (!merged.find((e) => e.name === f.name && e.size === f.size)) {
        merged.push(f)
      }
    }
    onChange(merged)
  }

  const remove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx))
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)
  const overLimit = totalSize > MAX_BYTES

  return (
    <Box>
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          // Use items API to support folder drops (flattens to files)
          if (e.dataTransfer.items) {
            const flat: File[] = []
            const entries: FileSystemEntry[] = []
            for (const item of Array.from(e.dataTransfer.items)) {
              const entry = item.webkitGetAsEntry?.()
              if (entry) entries.push(entry)
            }
            const readEntry = (entry: FileSystemEntry): Promise<void> => {
              if (entry.isFile) {
                return new Promise((res) => {
                  ;(entry as FileSystemFileEntry).file((f) => { flat.push(f); res() })
                })
              }
              const reader = (entry as FileSystemDirectoryEntry).createReader()
              return new Promise((res) => {
                reader.readEntries(async (sub) => {
                  await Promise.all(sub.map(readEntry))
                  res()
                })
              })
            }
            Promise.all(entries.map(readEntry)).then(() => {
              const dt = new DataTransfer()
              flat.forEach((f) => dt.items.add(f))
              addFiles(dt.files)
            })
          } else {
            addFiles(e.dataTransfer.files)
          }
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : overLimit ? 'error.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          bgcolor: dragging ? 'action.hover' : 'background.paper',
          transition: 'border-color .2s, background .2s',
          '&:hover': disabled ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {files.length === 0
            ? 'Drop files here or click to browse'
            : `${files.length} file${files.length !== 1 ? 's' : ''} selected`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Up to {MAX_FILES} files · max {formatBytes(MAX_BYTES)} total
        </Typography>
        <Box
          component="input"
          ref={inputRef}
          type="file"
          multiple
          aria-label="Choose files to upload"
          title="Choose files to upload"
          sx={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files); e.target.value = '' }}
          disabled={disabled}
        />
        <Box
          component="input"
          ref={folderInputRef}
          type="file"
          multiple
          aria-label="Choose folder to upload"
          sx={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files); e.target.value = '' }}
          disabled={disabled}
        />
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <List dense disablePadding>
            {files.map((f, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText
                  primary={f.name}
                  secondary={formatBytes(f.size)}
                  slotProps={{ primary: { noWrap: true, sx: { maxWidth: '80%' } } }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => remove(i)}
                    disabled={disabled}
                    aria-label={`Remove ${f.name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Typography
            variant="caption"
            color={overLimit ? 'error' : 'text.secondary'}
            sx={{ pl: 0.5 }}
          >
            Total: {formatBytes(totalSize)}
            {overLimit ? ` — exceeds ${formatBytes(MAX_BYTES)} limit` : ''}
          </Typography>
        </Box>
      )}

      {files.length > 0 && files.length < MAX_FILES && !disabled && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" onClick={() => inputRef.current?.click()}>
            + Add more files
          </Button>
          <Button size="small" onClick={() => folderElRef.current?.click()}>
            + Add folder
          </Button>
        </Stack>
      )}
    </Box>
  )
}
