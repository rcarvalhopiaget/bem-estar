import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export async function refreshUserToken(user: User): Promise<string> {
  try {
    // Força a atualização do usuário para ter certeza que temos os dados mais recentes
    await user.reload();
    
    // Obtém um novo token forçando a atualização
    const token = await user.getIdToken(true);
    
    // Atualiza o cookie de sessão
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar sessão');
    }

    return token;
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    throw error;
  }
}

export async function setupTokenRefresh(user: User) {
  try {
    // Configura a atualização inicial do token
    await refreshUserToken(user);

    // Configura um intervalo para atualizar o token periodicamente
    const interval = setInterval(async () => {
      try {
        if (auth.currentUser) {
          await refreshUserToken(auth.currentUser);
        }
      } catch (error) {
        console.error('Erro na atualização periódica do token:', error);
      }
    }, 10 * 60 * 1000); // Atualiza a cada 10 minutos

    return () => clearInterval(interval);
  } catch (error) {
    console.error('Erro ao configurar atualização de token:', error);
    throw error;
  }
}

export async function clearSession() {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Erro ao limpar sessão:', error);
    throw error;
  }
}
