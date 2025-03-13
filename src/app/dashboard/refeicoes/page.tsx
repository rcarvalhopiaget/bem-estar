'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RefeicaoManager } from '@/components/refeicoes/RefeicaoManager';
import { EmailVerification } from '@/components/EmailVerification';

export default function RefeicoesPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <EmailVerification />
      <RefeicaoManager />
    </div>
  );
}
