'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { refreshUserToken, setupTokenRefresh, clearSession } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Configura a atualização automática do token
          const cleanup = await setupTokenRefresh(user);
          setUser(user);
          return cleanup;
        } else {
          // Limpa a sessão quando o usuário faz logout
          await clearSession();
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao gerenciar estado de autenticação:', error);
        // Em caso de erro, limpa o estado do usuário
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Força a atualização do token após o login
      await refreshUserToken(result.user);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Força a atualização do token após o registro
      await refreshUserToken(result.user);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await clearSession();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
