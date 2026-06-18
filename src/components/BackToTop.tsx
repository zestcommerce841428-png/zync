'use client'

import * as React from 'react'
import Zoom from '@mui/material/Zoom'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

// Professional scroll-to-top button — fades in after scrolling and respects
// reduced-motion preferences (the global a11y CSS neutralizes the smooth
// scroll when "reduce motion" is on).
export default function BackToTop(): React.ReactElement {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 320 })

  const scrollUp = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <Zoom in={trigger}>
      <Tooltip title="Back to top" placement="left">
        <Fab
          size="small"
          color="primary"
          aria-label="Scroll back to top"
          onClick={scrollUp}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            zIndex: (t) => t.zIndex.speedDial,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Tooltip>
    </Zoom>
  )
}
