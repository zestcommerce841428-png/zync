import React from 'react'
import type { Metadata, Viewport } from 'next'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import Box from '@mui/material/Box'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ThemeRegistry from '../components/ThemeRegistry'
import FilePizzaQueryClientProvider from '../components/QueryClientProvider'
import { ViewTransitions } from 'next-view-transitions'
import { brand } from '../brand'
import Analytics from '../components/Analytics'
import SettingsPanel from '../components/settings/SettingsPanel'
import BackToTop from '../components/BackToTop'
import WhatsAppFab from '../components/WhatsAppFab'
import CookieConsent from '../components/consent/CookieConsent'
import { ConsentProvider } from '../components/consent/ConsentContext'

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} • ${brand.tagline}`,
    template: `%s • ${brand.name}`,
  },
  description: brand.shortDescription,
  applicationName: brand.name,
  authors: [{ name: brand.credits.author }],
  keywords: [
    'file transfer',
    'peer to peer',
    'p2p',
    'webrtc',
    'send files',
    'private file sharing',
    'encrypted file transfer',
    brand.name,
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    type: 'website',
    url: brand.url,
    siteName: brand.name,
    title: `${brand.name} • ${brand.tagline}`,
    description: brand.shortDescription,
    locale: brand.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} • ${brand.tagline}`,
    description: brand.shortDescription,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: brand.themeColor,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body>
          <InitColorSchemeScript attribute="class" defaultMode="system" />
          <ThemeRegistry>
            <ConsentProvider>
              <FilePizzaQueryClientProvider>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100dvh',
                  }}
                >
                  <Header />
                  <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {children}
                  </Box>
                  <Footer />
                </Box>
                <SettingsPanel />
                <WhatsAppFab />
                <BackToTop />
                <CookieConsent />
              </FilePizzaQueryClientProvider>
              <Analytics />
            </ConsentProvider>
          </ThemeRegistry>
        </body>
      </html>
    </ViewTransitions>
  )
}
