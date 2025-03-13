'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/Providers';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </Providers>
  );
}
