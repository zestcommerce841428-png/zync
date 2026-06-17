import type { Metadata } from 'next'
import SendApp from '../../components/SendApp'
import { brand } from '../../brand'

export const metadata: Metadata = {
  title: 'Send a file',
  description: `Send files securely with ${brand.name}. Direct, encrypted, peer-to-peer transfers — no uploads to a server, no size caps.`,
  alternates: { canonical: '/send' },
}

export default function SendPage(): React.ReactElement {
  return <SendApp />
}
