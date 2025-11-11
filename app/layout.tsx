import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
      <body>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[2000] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <div id="main-content">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

