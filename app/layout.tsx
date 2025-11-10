import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ezstudy - Academic Translation Companion',
  description: 'Real-time translation and learning companion for Chinese and Indonesian students',
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

