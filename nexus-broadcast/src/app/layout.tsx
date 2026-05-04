import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexus Connected TV',
  description: 'Standalone connected TV and FAST platform with channel operations, SCTE markers, ad insertion, monetization, and cloud playout control.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
