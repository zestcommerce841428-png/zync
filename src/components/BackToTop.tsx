'use client'

import * as React from 'react'
import Zoom from '@mui/material/Zoom'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

// Professional scroll helper. Uses a real scroll listener (more reliable than
// useScrollTrigger across layouts) and flips between "scroll to top" and
// "scroll to bottom" depending on where you are on the page.
export default function BackToTop(): React.ReactElement | null {
  const [mounted, setMounted] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [nearBottom, setNearBottom] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      const vh = window.innerHeight
      const full = document.documentElement.scrollHeight
      setScrolled(y > 200)
      setNearBottom(y + vh >= full - 200)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (!mounted) return null

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const goBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })

  const canScroll =
    document.documentElement.scrollHeight > window.innerHeight * 1.3
  // Once scrolled down, offer "back to top"; at the top of a long page, offer
  // "scroll to bottom". Hide when at the very bottom (top action still shows).
  const showUp = scrolled
  const action = showUp ? goTop : goBottom
  const label = showUp ? 'Back to top' : 'Scroll to bottom'
  const visible = canScroll && !(nearBottom && !scrolled)

  return (
    <Zoom in={visible}>
      <Tooltip title={label} placement="left">
        <Fab
          size="medium"
          color="primary"
          aria-label={label}
          onClick={action}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 140,
            zIndex: (t) => t.zIndex.tooltip + 1,
            boxShadow: 4,
          }}
        >
          {showUp ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Fab>
      </Tooltip>
    </Zoom>
  )
}
