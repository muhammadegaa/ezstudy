import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ezstudy - Academic Translation Companion',
  description: 'Real-time translation and learning companion for Chinese and Indonesian students',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

