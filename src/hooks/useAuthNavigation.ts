'use client';

import { useEffect } from 'react';
import { User } from 'firebase/auth';

async function setAuthSession(user: User): Promise<boolean> {
  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao configurar sessão:', error);
    return false;
  }
}

export function useAuthNavigation(user: User | null) {
  useEffect(() => {
    // Verifica se estamos na página de login
    const isLoginPage = window.location.pathname === '/login';
    
    if (user && isLoginPage) {
      // Se o usuário está autenticado e na página de login, configura a sessão
      // e redireciona para o dashboard
      const setupSession = async () => {
        const sessionOk = await setAuthSession(user);
        if (sessionOk) {
          window.location.href = '/dashboard';
        }
      };
      
      setupSession();
    } else if (!user && !isLoginPage && window.location.pathname.startsWith('/dashboard')) {
      // Se não há usuário e estamos em uma página protegida, redireciona para login
      window.location.href = '/login';
    }
  }, [user]);

  const navigateTo = async (path: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const sessionOk = await setAuthSession(user);
    if (sessionOk) {
      window.location.href = path;
    }
  };

  return { navigateTo };
}
