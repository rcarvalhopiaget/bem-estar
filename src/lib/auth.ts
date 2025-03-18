import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export async function refreshUserToken(user: User): Promise<string> {
  try {
    if (!user) {
      throw new Error('Usuário não fornecido para atualização de token');
    }

    // Força a atualização do usuário para ter certeza que temos os dados mais recentes
    try {
      await user.reload();
    } catch (reloadError) {
      console.warn('Erro ao recarregar usuário, continuando com dados atuais:', reloadError);
    }
    
    // Obtém um novo token forçando a atualização
    const token = await user.getIdToken(true);
    
    // Atualiza o cookie de sessão
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.warn(`Falha ao atualizar sessão: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.warn('Erro ao comunicar com API de sessão:', fetchError);
      // Retornamos o token mesmo se não conseguirmos atualizar o cookie
    }

    return token;
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    throw error;
  }
}

export async function setupTokenRefresh(user: User) {
  try {
    if (!user) {
      throw new Error('Usuário não fornecido para configuração de atualização de token');
    }

    // Configura a atualização inicial do token
    try {
      await refreshUserToken(user);
    } catch (initialRefreshError) {
      console.warn('Erro na atualização inicial do token, continuando setup:', initialRefreshError);
    }

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
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.warn(`Falha ao limpar sessão: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao limpar sessão:', error);
    throw error;
  }
}
