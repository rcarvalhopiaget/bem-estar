'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster as RadixToaster } from '@/components/ui/toast';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import { EmailJSInit } from '@/components/EmailJSInit';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AuthProvider>
        <EmailJSInit />
        {children}
        <RadixToaster />
        <HotToaster position="top-right" />
      </AuthProvider>
    </Providers>
  );
}
