'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import QRCode from 'react-qr-code'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function CopyButton({ value }: { value: string }): React.ReactElement {
  const [copied, setCopied] = React.useState(false)
  return (
    <Tooltip title={copied ? 'Copied' : 'Copy'}>
      <IconButton
        size="small"
        onClick={() => {
          navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

function Output({ value, label = 'Result' }: { value: string; label?: string }) {
  if (!value) return null
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="overline" color="text.secondary">{label}</Typography>
        <CopyButton value={value} />
      </Stack>
      <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 13, m: 0 }}>
        {value}
      </Typography>
    </Paper>
  )
}

// 1. Password generator
function PasswordGenerator() {
  const [len, setLen] = React.useState(16)
  const [upper, setUpper] = React.useState(true)
  const [lower, setLower] = React.useState(true)
  const [nums, setNums] = React.useState(true)
  const [syms, setSyms] = React.useState(true)
  const [pw, setPw] = React.useState('')

  const gen = React.useCallback(() => {
    let set = ''
    if (upper) set += 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    if (lower) set += 'abcdefghijkmnopqrstuvwxyz'
    if (nums) set += '23456789'
    if (syms) set += '!@#$%^&*()-_=+[]{}'
    if (!set) { setPw(''); return }
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr)
    setPw(Array.from(arr, (n) => set[n % set.length]).join(''))
  }, [len, upper, lower, nums, syms])

  React.useEffect(() => { gen() }, [gen])

  return (
    <Stack spacing={2}>
      <Output value={pw} label="Password" />
      <Box>
        <Typography gutterBottom>Length: {len}</Typography>
        <Slider min={6} max={64} value={len} onChange={(_, v) => setLen(v as number)} />
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap' }}>
        <FormControlLabel control={<Switch checked={upper} onChange={(e) => setUpper(e.target.checked)} />} label="A-Z" />
        <FormControlLabel control={<Switch checked={lower} onChange={(e) => setLower(e.target.checked)} />} label="a-z" />
        <FormControlLabel control={<Switch checked={nums} onChange={(e) => setNums(e.target.checked)} />} label="0-9" />
        <FormControlLabel control={<Switch checked={syms} onChange={(e) => setSyms(e.target.checked)} />} label="!@#" />
      </Stack>
      <Button variant="contained" onClick={gen}>Regenerate</Button>
    </Stack>
  )
}

// 2. QR generator
function QrGenerator() {
  const [text, setText] = React.useState('https://zync.app')
  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <TextField label="Text or URL" fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      {text && (
        <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2 }}>
          <QRCode value={text} size={200} />
        </Box>
      )}
    </Stack>
  )
}

// 3. File & text hash
function FileHash() {
  const [text, setText] = React.useState('')
  const [algo, setAlgo] = React.useState<'SHA-256' | 'SHA-1' | 'SHA-512'>('SHA-256')
  const [out, setOut] = React.useState('')

  const hashBuffer = async (buf: BufferSource) => {
    const digest = await crypto.subtle.digest(algo, buf)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  const hashText = async () => setOut(await hashBuffer(new TextEncoder().encode(text)))
  const hashFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setOut(await hashBuffer(await f.arrayBuffer()))
  }

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup exclusive size="small" value={algo} onChange={(_, v) => v && setAlgo(v)}>
        <ToggleButton value="SHA-256">SHA-256</ToggleButton>
        <ToggleButton value="SHA-1">SHA-1</ToggleButton>
        <ToggleButton value="SHA-512">SHA-512</ToggleButton>
      </ToggleButtonGroup>
      <TextField label="Text" multiline minRows={3} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" onClick={hashText}>Hash text</Button>
        <Button variant="outlined" component="label">Hash file<input type="file" hidden onChange={hashFile} /></Button>
      </Stack>
      <Output value={out} label={algo} />
    </Stack>
  )
}

// 4. Base64
function Base64Tool() {
  const [text, setText] = React.useState('')
  const [out, setOut] = React.useState('')
  const [err, setErr] = React.useState('')
  const enc = () => { try { setErr(''); setOut(btoa(unescape(encodeURIComponent(text)))) } catch { setErr('Could not encode.') } }
  const dec = () => { try { setErr(''); setOut(decodeURIComponent(escape(atob(text)))) } catch { setErr('Invalid Base64.') } }
  return (
    <Stack spacing={2}>
      <TextField label="Input" multiline minRows={4} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Stack direction="row" spacing={1.5}><Button variant="contained" onClick={enc}>Encode</Button><Button variant="outlined" onClick={dec}>Decode</Button></Stack>
      {err && <Alert severity="error">{err}</Alert>}
      <Output value={out} />
    </Stack>
  )
}

// 5. URL encode
function UrlTool() {
  const [text, setText] = React.useState('')
  const [out, setOut] = React.useState('')
  return (
    <Stack spacing={2}>
      <TextField label="Input" multiline minRows={3} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" onClick={() => setOut(encodeURIComponent(text))}>Encode</Button>
        <Button variant="outlined" onClick={() => { try { setOut(decodeURIComponent(text)) } catch { setOut('Invalid input') } }}>Decode</Button>
      </Stack>
      <Output value={out} />
    </Stack>
  )
}

// 6. UUID generator
function UuidGenerator() {
  const [n, setN] = React.useState(5)
  const [out, setOut] = React.useState('')
  const gen = React.useCallback(() => setOut(Array.from({ length: n }, () => crypto.randomUUID()).join('\n')), [n])
  React.useEffect(() => { gen() }, [gen])
  return (
    <Stack spacing={2}>
      <Box><Typography gutterBottom>Count: {n}</Typography><Slider min={1} max={50} value={n} onChange={(_, v) => setN(v as number)} /></Box>
      <Button variant="contained" onClick={gen}>Generate</Button>
      <Output value={out} label="UUIDs" />
    </Stack>
  )
}

// 7. JSON formatter
function JsonFormatter() {
  const [text, setText] = React.useState('')
  const [out, setOut] = React.useState('')
  const [err, setErr] = React.useState('')
  const fmt = (min: boolean) => { try { setErr(''); const o = JSON.parse(text); setOut(JSON.stringify(o, null, min ? 0 : 2)) } catch (e) { setErr((e as Error).message) } }
  return (
    <Stack spacing={2}>
      <TextField label="JSON" multiline minRows={6} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Stack direction="row" spacing={1.5}><Button variant="contained" onClick={() => fmt(false)}>Prettify</Button><Button variant="outlined" onClick={() => fmt(true)}>Minify</Button></Stack>
      {err ? <Alert severity="error">{err}</Alert> : <Alert severity="success" sx={{ display: out ? 'flex' : 'none' }}>Valid JSON</Alert>}
      <Output value={out} />
    </Stack>
  )
}

// 8. Word counter
function WordCounter() {
  const [text, setText] = React.useState('')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || 1 : 0
  const minutes = Math.max(1, Math.round(words / 200))
  const stats = [['Words', words], ['Characters', chars], ['Sentences', sentences], ['Reading time', `${minutes} min`]] as const
  return (
    <Stack spacing={2}>
      <TextField label="Text" multiline minRows={6} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {stats.map(([k, v]) => (
          <Paper key={k} variant="outlined" sx={{ p: 2, minWidth: 110, textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{v}</Typography>
            <Typography variant="caption" color="text.secondary">{k}</Typography>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}

// 9. Case converter
function CaseConverter() {
  const [text, setText] = React.useState('')
  const toTitle = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
  const toCamel = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
  const toSnake = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const toKebab = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const variants: Array<[string, string]> = [
    ['UPPERCASE', text.toUpperCase()],
    ['lowercase', text.toLowerCase()],
    ['Title Case', toTitle(text)],
    ['camelCase', toCamel(text)],
    ['snake_case', toSnake(text)],
    ['kebab-case', toKebab(text)],
  ]
  return (
    <Stack spacing={2}>
      <TextField label="Text" multiline minRows={3} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      {text && variants.map(([k, v]) => <Output key={k} value={v} label={k} />)}
    </Stack>
  )
}

// 10. Lorem ipsum
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'.split(' ')
function LoremIpsum() {
  const [count, setCount] = React.useState(3)
  const [unit, setUnit] = React.useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
  const sentence = () => { const len = 8 + Math.floor(Math.random() * 8); const s = Array.from({ length: len }, () => LOREM[Math.floor(Math.random() * LOREM.length)]).join(' '); return s[0].toUpperCase() + s.slice(1) + '.' }
  const para = () => Array.from({ length: 4 + Math.floor(Math.random() * 3) }, sentence).join(' ')
  const out = unit === 'words' ? Array.from({ length: count }, () => LOREM[Math.floor(Math.random() * LOREM.length)]).join(' ')
    : unit === 'sentences' ? Array.from({ length: count }, sentence).join(' ')
    : Array.from({ length: count }, para).join('\n\n')
  const [text, setText] = React.useState('')
  return (
    <Stack spacing={2}>
      <ToggleButtonGroup exclusive size="small" value={unit} onChange={(_, v) => v && setUnit(v)}>
        <ToggleButton value="paragraphs">Paragraphs</ToggleButton><ToggleButton value="sentences">Sentences</ToggleButton><ToggleButton value="words">Words</ToggleButton>
      </ToggleButtonGroup>
      <Box><Typography gutterBottom>Count: {count}</Typography><Slider min={1} max={20} value={count} onChange={(_, v) => setCount(v as number)} /></Box>
      <Button variant="contained" onClick={() => setText(out)}>Generate</Button>
      <Output value={text} />
    </Stack>
  )
}

// 11. Color converter
function hexToRgb(hex: string) { const m = hex.replace('#', '').match(/.{1,2}/g); if (!m || m.length < 3) return null; const [r, g, b] = m.map((x) => parseInt(x, 16)); return { r, g, b } }
function rgbToHsl(r: number, g: number, b: number) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6 } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) } }
function ColorConverter() {
  const [hex, setHex] = React.useState('#6366f1')
  const rgb = hexToRgb(hex)
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box component="input" type="color" aria-label="Pick a color" title="Pick a color" value={hex} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHex(e.target.value)} sx={{ width: 56, height: 56, border: 'none', background: 'none', cursor: 'pointer' }} />
        <TextField label="HEX" value={hex} onChange={(e) => setHex(e.target.value)} />
      </Stack>
      {rgb && <Output value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} label="RGB" />}
      {hsl && <Output value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="HSL" />}
    </Stack>
  )
}

// 12. Timestamp
function TimestampTool() {
  const [ts, setTs] = React.useState(String(Math.floor(Date.now() / 1000)))
  const [date, setDate] = React.useState('')
  const fromTs = Number(ts) ? new Date(Number(ts) * 1000).toString() : 'Invalid'
  return (
    <Stack spacing={2}>
      <TextField label="Unix timestamp (seconds)" value={ts} onChange={(e) => setTs(e.target.value)} />
      <Output value={fromTs} label="Date" />
      <TextField label="Date (any parseable string)" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-06-17" />
      <Output value={date && !isNaN(Date.parse(date)) ? String(Math.floor(Date.parse(date) / 1000)) : ''} label="Timestamp" />
    </Stack>
  )
}

// 13. Slug
function SlugGenerator() {
  const [text, setText] = React.useState('')
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <Stack spacing={2}>
      <TextField label="Title" fullWidth value={text} onChange={(e) => setText(e.target.value)} />
      <Output value={slug} label="Slug" />
    </Stack>
  )
}

// 14. Markdown preview
function MarkdownPreview() {
  const [text, setText] = React.useState('# Hello, Zync\n\nType **Markdown** on the left.\n\n- Lists\n- [Links](https://zync.app)\n- `code`')
  return (
    <Stack spacing={2}>
      <TextField label="Markdown" multiline minRows={8} fullWidth value={text} onChange={(e) => setText(e.target.value)} sx={{ fontFamily: 'monospace' }} />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </Paper>
    </Stack>
  )
}

// 15. Text diff
function TextDiff() {
  const [a, setA] = React.useState('')
  const [b, setB] = React.useState('')
  const linesA = a.split('\n'); const linesB = b.split('\n')
  const max = Math.max(linesA.length, linesB.length)
  const rows = Array.from({ length: max }, (_, i) => ({ a: linesA[i] ?? '', b: linesB[i] ?? '', same: (linesA[i] ?? '') === (linesB[i] ?? '') }))
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Original" multiline minRows={6} fullWidth value={a} onChange={(e) => setA(e.target.value)} />
        <TextField label="Changed" multiline minRows={6} fullWidth value={b} onChange={(e) => setB(e.target.value)} />
      </Stack>
      {(a || b) && (
        <Paper variant="outlined" sx={{ p: 1.5, fontFamily: 'monospace', fontSize: 13 }}>
          {rows.map((r, i) => (
            <Box key={i} sx={{ bgcolor: r.same ? 'transparent' : 'warning.main', color: r.same ? 'text.primary' : 'warning.contrastText', px: 1, borderRadius: 0.5, opacity: r.same ? 0.7 : 1 }}>
              {i + 1}. {r.same ? r.a : `- ${r.a}  |  + ${r.b}`}
            </Box>
          ))}
        </Paper>
      )}
    </Stack>
  )
}

export const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  'password-generator': PasswordGenerator,
  'qr-generator': QrGenerator,
  'file-hash': FileHash,
  base64: Base64Tool,
  'url-encode': UrlTool,
  'uuid-generator': UuidGenerator,
  'json-formatter': JsonFormatter,
  'word-counter': WordCounter,
  'case-converter': CaseConverter,
  'lorem-ipsum': LoremIpsum,
  'color-converter': ColorConverter,
  timestamp: TimestampTool,
  'slug-generator': SlugGenerator,
  'markdown-preview': MarkdownPreview,
  'text-diff': TextDiff,
}
