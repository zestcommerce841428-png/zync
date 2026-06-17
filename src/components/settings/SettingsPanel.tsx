'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Fab from '@mui/material/Fab'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useColorScheme } from '@mui/material/styles'
import Chip from '@mui/material/Chip'
import {
  useSettings,
  PRIMARY_PRESETS,
  FONT_FAMILIES,
  THEME_PRESETS,
} from './SettingsContext'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function ModeControl(): React.ReactElement {
  const { mode, setMode } = useColorScheme()
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={mode ?? 'system'}
      onChange={(_, v) => v && setMode(v)}
    >
      <ToggleButton value="light">Light</ToggleButton>
      <ToggleButton value="dark">Dark</ToggleButton>
      <ToggleButton value="system">System</ToggleButton>
    </ToggleButtonGroup>
  )
}

function ReadingGuide(): React.ReactElement {
  const [y, setY] = React.useState(0)
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => setY(e.clientY)
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: y - 16,
        height: 32,
        bgcolor: 'rgba(99,102,241,0.15)',
        borderTop: '2px solid #6366f1',
        borderBottom: '2px solid #6366f1',
        pointerEvents: 'none',
        zIndex: (t) => t.zIndex.tooltip + 2,
      }}
    />
  )
}

export default function SettingsPanel(): React.ReactElement {
  const { settings, update, reset } = useSettings()
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const openTo = (t: number) => {
    setTab(t)
    setOpen(true)
  }

  return (
    <>
      {mounted && (
        <Stack
          spacing={1}
          sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: (t) => t.zIndex.speedDial }}
        >
          <Tooltip title="Accessibility" placement="left">
            <Fab
              size="medium"
              color="primary"
              aria-label="Open accessibility settings"
              onClick={() => openTo(1)}
            >
              <AccessibilityNewIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Appearance" placement="left">
            <Fab
              size="small"
              aria-label="Open appearance settings"
              onClick={() => openTo(0)}
            >
              <TuneIcon />
            </Fab>
          </Tooltip>
        </Stack>
      )}

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 360 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Personalize
            </Typography>
            <IconButton onClick={() => setOpen(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Appearance" />
            <Tab label="Accessibility" />
          </Tabs>

          <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
            {tab === 0 && (
              <>
                <Section title="Color mode">
                  <ModeControl />
                </Section>

                <Section title="Theme presets">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(THEME_PRESETS).map(([key, p]) => (
                      <Chip
                        key={key}
                        label={p.label}
                        onClick={() => {
                          update('primary', p.primary)
                          update('radius', p.radius)
                          update('fontFamily', p.fontFamily)
                        }}
                        variant={settings.primary === p.primary ? 'filled' : 'outlined'}
                        color={settings.primary === p.primary ? 'primary' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </Section>

                <Section title="Accent color">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(PRIMARY_PRESETS).map(([name, hex]) => (
                      <Box
                        key={name}
                        component="button"
                        aria-label={name}
                        onClick={() => update('primary', name as keyof typeof PRIMARY_PRESETS)}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          bgcolor: hex,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor:
                            settings.primary === name ? 'text.primary' : 'transparent',
                          outline: 'none',
                        }}
                      />
                    ))}
                  </Box>
                </Section>

                <Section title="Font family">
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={settings.fontFamily}
                    onChange={(e) => update('fontFamily', e.target.value as keyof typeof FONT_FAMILIES)}
                  >
                    {Object.keys(FONT_FAMILIES).map((f) => (
                      <MenuItem key={f} value={f} sx={{ textTransform: 'capitalize' }}>
                        {f}
                      </MenuItem>
                    ))}
                  </TextField>
                </Section>

                <Section title={`Text size — ${Math.round(settings.fontScale * 100)}%`}>
                  <Slider
                    min={0.85}
                    max={1.3}
                    step={0.05}
                    value={settings.fontScale}
                    onChange={(_, v) => update('fontScale', v as number)}
                  />
                </Section>

                <Section title={`Corner radius — ${settings.radius}px`}>
                  <Slider
                    min={0}
                    max={24}
                    step={1}
                    value={settings.radius}
                    onChange={(_, v) => update('radius', v as number)}
                  />
                </Section>

                <Section title="Density">
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.density}
                    onChange={(_, v) => v && update('density', v)}
                  >
                    <ToggleButton value="comfortable">Comfortable</ToggleButton>
                    <ToggleButton value="compact">Compact</ToggleButton>
                  </ToggleButtonGroup>
                </Section>

                <Section title="Direction">
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.direction}
                    onChange={(_, v) => v && update('direction', v)}
                  >
                    <ToggleButton value="ltr">LTR</ToggleButton>
                    <ToggleButton value="rtl">RTL</ToggleButton>
                  </ToggleButtonGroup>
                </Section>
              </>
            )}

            {tab === 1 && (
              <>
                <Section title="Contrast">
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.contrast}
                    onChange={(_, v) => v && update('contrast', v)}
                  >
                    <ToggleButton value="normal">Normal</ToggleButton>
                    <ToggleButton value="high">High</ToggleButton>
                  </ToggleButtonGroup>
                </Section>

                <Section title="Color saturation">
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.saturation}
                    onChange={(_, v) => v && update('saturation', v)}
                  >
                    <ToggleButton value="normal">Normal</ToggleButton>
                    <ToggleButton value="muted">Muted</ToggleButton>
                    <ToggleButton value="grayscale">Gray</ToggleButton>
                  </ToggleButtonGroup>
                </Section>

                <Section title="Text alignment">
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.textAlign}
                    onChange={(_, v) => v && update('textAlign', v)}
                  >
                    <ToggleButton value="default">Default</ToggleButton>
                    <ToggleButton value="left">Left</ToggleButton>
                    <ToggleButton value="justify">Justify</ToggleButton>
                  </ToggleButtonGroup>
                </Section>

                <Section title={`Letter spacing — ${settings.letterSpacing}em`}>
                  <Slider
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={settings.letterSpacing}
                    onChange={(_, v) => update('letterSpacing', v as number)}
                  />
                </Section>

                <Section title={`Line height — ${settings.lineHeight}`}>
                  <Slider
                    min={1.2}
                    max={2.4}
                    step={0.1}
                    value={settings.lineHeight}
                    onChange={(_, v) => update('lineHeight', v as number)}
                  />
                </Section>

                <Section title={`Word spacing — ${settings.wordSpacing}px`}>
                  <Slider
                    min={0}
                    max={16}
                    step={1}
                    value={settings.wordSpacing}
                    onChange={(_, v) => update('wordSpacing', v as number)}
                  />
                </Section>

                <Divider sx={{ mb: 2 }} />

                <Stack>
                  {(
                    [
                      ['underlineLinks', 'Underline links'],
                      ['highlightLinks', 'Highlight links'],
                      ['highlightHeadings', 'Highlight headings'],
                      ['highlightHover', 'Highlight on hover'],
                      ['bigCursor', 'Large cursor'],
                      ['biggerTargets', 'Bigger click targets'],
                      ['focusRing', 'Enhanced focus outline'],
                      ['readingGuide', 'Reading guide'],
                      ['hideImages', 'Hide images'],
                      ['hideBackgrounds', 'Hide background graphics'],
                      ['invert', 'Invert colors'],
                      ['dyslexiaSpacing', 'Dyslexia-friendly spacing'],
                      ['motion', 'Reduce motion'],
                      ['pauseAnimations', 'Pause all animations'],
                    ] as const
                  ).map(([key, label]) => {
                    const checked =
                      key === 'motion'
                        ? settings.motion === 'reduced'
                        : Boolean(settings[key])
                    return (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            checked={checked}
                            onChange={(e) => {
                              if (key === 'motion') {
                                update('motion', e.target.checked ? 'reduced' : 'normal')
                              } else {
                                update(key, e.target.checked as never)
                              }
                            }}
                          />
                        }
                        label={label}
                      />
                    )
                  })}
                </Stack>
              </>
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={reset}
            >
              Reset to defaults
            </Button>
          </Box>
        </Box>
      </Drawer>

      {mounted && settings.readingGuide && <ReadingGuide />}
    </>
  )
}
