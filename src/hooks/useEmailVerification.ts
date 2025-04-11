'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sendVerificationEmailWithRetry, refreshUserToken } from '@/services/auth';

export function useEmailVerification() {
  const [isVerified, setIsVerified] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Efeito vazio pois estamos ignorando a verificação
    setLoading(false);
  }, []);

  const sendVerificationEmail = async () => {
    try {
      await sendVerificationEmailWithRetry();
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      throw error;
    }
  };

  return {
    isVerified: true,
    loading: false,
    sendVerificationEmail
  };
}
