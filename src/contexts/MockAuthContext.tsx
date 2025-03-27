'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockUser {
  uid: string;
  email: string;
  displayName: string;
}

interface MockUserData {
  nome: string;
  email: string;
  cargo: string;
  perfil: string;
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

interface MockAuthContextType {
  user: MockUser | null;
  userData: MockUserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Valores simulados
const mockUser: MockUser = {
  uid: 'mock-user-id-123',
  email: 'admin@example.com',
  displayName: 'Administrador'
};

const mockUserData: MockUserData = {
  nome: 'Administrador',
  email: 'admin@example.com',
  cargo: 'Administrador',
  perfil: 'admin',
  ativo: true,
  dataCriacao: new Date(),
  dataAtualizacao: new Date()
};

// Contexto
const MockAuthContext = createContext<MockAuthContextType | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [userData, setUserData] = useState<MockUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento inicial e já define o usuário como autenticado
    const timer = setTimeout(() => {
      setUser(mockUser);
      setUserData(mockUserData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 800));
      setUser(mockUser);
      setUserData(mockUserData);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    setLoading(true);
    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 800));
      const newUser = { ...mockUser, email, displayName: name };
      const newUserData = { ...mockUserData, email, nome: name };
      setUser(newUser);
      setUserData(newUserData);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MockAuthContext.Provider value={{ user, userData, loading, signIn, signUp, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth deve ser usado dentro de um MockAuthProvider');
  }
  return context;
};

// Para compatibilidade com o código existente
export const useAuth = useMockAuth; 