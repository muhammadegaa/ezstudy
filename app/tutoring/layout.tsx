'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';

export default function TutoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute requireAuth={true}>{children}</ProtectedRoute>;
}
