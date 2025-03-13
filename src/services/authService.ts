import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export class AuthService {
  static async setSession(user: User): Promise<boolean> {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Falha ao configurar sessão');
      }

      return true;
    } catch (error) {
      console.error('Erro ao configurar sessão:', error);
      return false;
    }
  }

  static async removeSession(): Promise<void> {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Erro ao remover sessão:', error);
    }
  }

  static async redirectToDashboard(user: User | null): Promise<void> {
    if (!user) return;

    try {
      // Garante que a sessão está configurada
      const sessionConfigured = await this.setSession(user);
      
      if (sessionConfigured) {
        // Aguarda um momento para garantir que o token foi processado
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
    }
  }

  static async redirectToLogin(): Promise<void> {
    try {
      await this.removeSession();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao redirecionar para login:', error);
    }
  }
}
