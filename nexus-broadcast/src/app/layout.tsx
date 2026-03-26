import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexus Broadcast Orchestrate',
  description: 'Hybrid Cloud-to-Ground Broadcast Orchestration Platform with device health, routing, automation, and compliance visibility.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
