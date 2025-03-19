'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster as RadixToaster } from '@/components/ui/Toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
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
        <RadixToaster />
        <HotToaster position="top-right" />
      </AuthProvider>
    </Providers>
  );
}
