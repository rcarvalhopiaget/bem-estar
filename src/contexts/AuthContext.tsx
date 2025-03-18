'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { refreshUserToken, setupTokenRefresh, clearSession } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, name: string) => Promise<User | null>;
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
          try {
            const cleanup = await setupTokenRefresh(user);
            setUser(user);
            return cleanup;
          } catch (tokenError) {
            console.error('Erro ao configurar atualização de token:', tokenError);
            // Mesmo com erro no token, mantemos o usuário autenticado
            setUser(user);
          }
        } else {
          // Limpa a sessão quando o usuário faz logout
          try {
            await clearSession();
          } catch (sessionError) {
            console.error('Erro ao limpar sessão:', sessionError);
          }
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
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Força a atualização do token após o login
      try {
        await refreshUserToken(result.user);
      } catch (tokenError) {
        console.error('Erro ao atualizar token após login:', tokenError);
        // Continuamos mesmo se houver erro no token
      }
      return result.user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Atualiza o perfil do usuário com o nome
      await updateProfile(result.user, { displayName: name });
      // Força a atualização do token após o registro
      try {
        await refreshUserToken(result.user);
      } catch (tokenError) {
        console.error('Erro ao atualizar token após registro:', tokenError);
        // Continuamos mesmo se houver erro no token
      }
      return result.user;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      try {
        await clearSession();
      } catch (sessionError) {
        console.error('Erro ao limpar sessão durante logout:', sessionError);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
