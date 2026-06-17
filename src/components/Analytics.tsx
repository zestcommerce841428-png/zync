'use client'

import * as React from 'react'
import Script from 'next/script'

// Google Analytics 4 loader. Renders nothing unless NEXT_PUBLIC_GA_ID is set,
// so the app runs cleanly in development / before keys are provided.
export default function Analytics(): React.ReactElement | null {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
