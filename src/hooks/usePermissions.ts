'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export function usePermissions() {
  const { user } = useAuth();
  const { isVerified } = useEmailVerification();
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    // Usuário precisa estar autenticado e com email verificado para ter permissões de escrita
    setCanWrite(!!user && isVerified);
  }, [user, isVerified]);

  return {
    canWrite,
    isAuthenticated: !!user,
    isEmailVerified: isVerified,
    hasPermission: canWrite
  };
}
