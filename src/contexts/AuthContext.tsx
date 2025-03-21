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
import { auth, db } from '@/lib/firebase';
import { refreshUserToken, setupTokenRefresh, clearSession } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';

// Interface para os dados do usuário no Firestore
export interface UserData {
  nome?: string;
  email?: string;
  cargo?: string;
  perfil?: string;
  ativo?: boolean;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, name: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário no Firestore
  const fetchUserData = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        console.log('Nenhum dado de usuário encontrado no Firestore');
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Configura a atualização automática do token
          try {
            const cleanup = await setupTokenRefresh(user);
            setUser(user);
            
            // Buscar dados adicionais do usuário no Firestore
            await fetchUserData(user.uid);
            
            return cleanup;
          } catch (tokenError) {
            console.error('Erro ao configurar atualização de token:', tokenError);
            // Mesmo com erro no token, mantemos o usuário autenticado
            setUser(user);
            
            // Buscar dados adicionais do usuário no Firestore
            await fetchUserData(user.uid);
          }
        } else {
          // Limpa a sessão quando o usuário faz logout
          try {
            await clearSession();
          } catch (sessionError) {
            console.error('Erro ao limpar sessão:', sessionError);
          }
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Erro ao gerenciar estado de autenticação:', error);
        // Em caso de erro, limpa o estado do usuário
        setUser(null);
        setUserData(null);
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
      
      // Buscar dados adicionais do usuário no Firestore
      await fetchUserData(result.user.uid);
      
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
      
      // Buscar dados adicionais do usuário no Firestore
      await fetchUserData(result.user.uid);
      
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
      setUserData(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
