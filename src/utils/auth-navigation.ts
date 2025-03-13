import { User } from 'firebase/auth';

export async function setupAuthSession(user: User): Promise<boolean> {
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

export async function navigateAfterAuth(user: User | null, targetPath: string = '/dashboard'): Promise<void> {
  if (!user) {
    window.location.href = '/login';
    return;
  }

  try {
    // Configura a sessão
    const sessionOk = await setupAuthSession(user);
    
    if (sessionOk) {
      // Aguarda um momento para garantir que o cookie foi processado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redireciona para a página alvo
      window.location.href = targetPath;
    } else {
      throw new Error('Falha ao configurar sessão');
    }
  } catch (error) {
    console.error('Erro ao navegar após autenticação:', error);
    window.location.href = '/login';
  }
}
