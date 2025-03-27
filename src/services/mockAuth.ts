// Serviço de autenticação simulado para desenvolvimento
interface User {
  id: string;
  email: string;
  name: string;
}

// Usuários para teste
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Administrador'
  },
  {
    id: '2',
    email: 'usuario@example.com',
    name: 'Usuário Padrão'
  }
];

// Mock de armazenamento local para simular persistência
const storeUserInSession = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

const getUserFromSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('currentUser');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch (e) {
    console.error('Erro ao recuperar usuário da sessão', e);
    return null;
  }
};

export const clearUserSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
};

// Serviço de autenticação simulado
export const mockAuthService = {
  // Login simulado
  login: async (email: string, password: string): Promise<User> => {
    console.log('Tentando login com:', email);
    return new Promise((resolve, reject) => {
      // Simula uma pequena latência
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
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
  register: async (name: string, email: string, password: string): Promise<User> => {
    console.log('Tentando registrar:', email);
    return new Promise((resolve, reject) => {
      // Simula uma pequena latência
      setTimeout(() => {
        if (MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
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
        const newUser: User = {
          id: String(Date.now()), // ID único baseado no timestamp
          email,
          name
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
  getCurrentUser: (): User | null => {
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