/* Pre-hydration color-scheme init — prevents a flash of the wrong theme.
   Loaded as an external script so React never renders an inline <script>
   (which React 19 warns about). Mirrors MUI's class-based color scheme
   (storage key: mui-mode; classes: light / dark). */
;(function () {
  try {
    var m = localStorage.getItem('mui-mode') || 'system'
    var d =
      m === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : m
    var c = document.documentElement.classList
    c.remove('light', 'dark')
    c.add(d)
  } catch (e) {}
})()
