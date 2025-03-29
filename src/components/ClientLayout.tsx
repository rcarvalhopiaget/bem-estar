'use client';

import { Toaster as HotToaster } from 'react-hot-toast';
import { EmailJSInit } from '@/components/EmailJSInit';
import { Toaster as RadixToaster } from '@/components/ui/toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <EmailJSInit />
      {children}
      <RadixToaster />
      <HotToaster position="top-right" />
    </>
  );
}
