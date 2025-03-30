import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

// Serviço de autenticação simulado para desenvolvimento
interface AuthServiceUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Usuários para teste
const MOCK_USERS: AuthServiceUser[] = [
  {
    uid: '1',
    email: 'admin@example.com',
    displayName: 'Administrador'
  },
  {
    uid: '2',
    email: 'usuario@example.com',
    displayName: 'Usuário Padrão'
  }
];

// Mock de armazenamento local para simular persistência
const storeUserInSession = (user: AuthServiceUser): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

const getUserFromSession = (): AuthServiceUser | null => {
  const stored = localStorage.getItem('currentUser');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthServiceUser;
  } catch (e) {
    console.error('Erro ao recuperar usuário da sessão', e);
    return null;
  }
};

export const clearUserSession = (): void => {
  localStorage.removeItem('currentUser');
};

// Serviço de autenticação simulado
export const authService = {
  // Login simulado
  login: async (email: string, password: string): Promise<AuthServiceUser> => {
    console.log('Tentando login com:', email);
    return new Promise((resolve, reject) => {
      // Simula uma pequena latência
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email === email);
        
        if (user && password.length >= 6) {
          console.log('Login bem-sucedido:', user);
          storeUserInSession(user);
          resolve(user);
        } else {
          console.error('Credenciais inválidas');
          reject(new Error('Credenciais inválidas'));
        }
      }, 800);
    });
  },
  
  // Registro simulado
  register: async (name: string, email: string, password: string): Promise<AuthServiceUser> => {
    console.log('Tentando registrar:', email);
    return new Promise((resolve, reject) => {
      // Simula uma pequena latência
      setTimeout(() => {
        if (MOCK_USERS.some(u => u.email === email)) {
          console.error('Email já existe');
          reject(new Error('Email já cadastrado'));
          return;
        }
        
        if (password.length < 6) {
          console.error('Senha muito curta');
          reject(new Error('A senha deve ter pelo menos 6 caracteres'));
          return;
        }
        
        // Cria um novo usuário simulado
        const newUser: AuthServiceUser = {
          uid: String(Date.now()), // ID único baseado no timestamp
          email,
          displayName: name
        };
        
        // Em uma aplicação real, o usuário seria persistido em um banco de dados
        // Aqui apenas simulamos o sucesso e armazenamos na sessão
        console.log('Registro bem-sucedido:', newUser);
        storeUserInSession(newUser);
        resolve(newUser);
      }, 800);
    });
  },
  
  // Verifica se o usuário está autenticado
  getCurrentUser: (): AuthServiceUser | null => {
    return getUserFromSession();
  },
  
  // Logout
  logout: async (): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        clearUserSession();
        resolve();
      }, 300);
    });
  }
};

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
