'use client';

import { Toaster as HotToaster } from 'react-hot-toast';
import { EmailJSInit } from '@/components/EmailJSInit';
import { Toaster } from '@/components/ui/toaster';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <EmailJSInit />
      {children}
      <Toaster />
      <HotToaster position="top-right" />
    </>
  );
}
