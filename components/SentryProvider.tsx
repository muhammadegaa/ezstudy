'use client';

import { useEffect } from 'react';
import { initSentry } from '@/lib/sentry';

/**
 * Sentry Provider Component
 * Initializes Sentry error tracking on the client side
 */
export default function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry();
  }, []);

  return <>{children}</>;
}

