'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sendVerificationEmailWithRetry, refreshUserToken } from '@/services/auth';

export function useEmailVerification() {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Função para verificar o status do email
    const checkEmailVerification = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Força recarregar o usuário e atualizar o token
        await refreshUserToken();
        
        if (mounted) {
          setIsVerified(auth.currentUser.emailVerified);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar email:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Verifica imediatamente
    checkEmailVerification();

    // Configura um intervalo para verificar periodicamente
    const interval = setInterval(checkEmailVerification, 5000); // Reduzido para 5 segundos

    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
    isVerified,
    loading,
    sendVerificationEmail
  };
}
