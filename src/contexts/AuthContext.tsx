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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

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
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário no Firestore
  const fetchUserData = async (userId: string) => {
    if (!db) {
      console.error('Firestore não está inicializado');
      return;
    }
    
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
    if (!auth) {
      console.error('Auth não está inicializado');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    if (!auth) {
      console.error('Auth não está inicializado');
      throw new Error('Autenticação não inicializada');
    }
    
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user.uid);
      
      // Criar um cookie de sessão no cliente
      if (typeof document !== 'undefined') {
        document.cookie = `session=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 dias
      }
      
      return result.user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<User> => {
    if (!auth) {
      console.error('Auth não está inicializado');
      throw new Error('Autenticação não inicializada');
    }
    
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await fetchUserData(result.user.uid);
      
      // Criar um cookie de sessão no cliente
      if (typeof document !== 'undefined') {
        document.cookie = `session=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 dias
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
    if (!auth) {
      console.error('Auth não está inicializado');
      throw new Error('Autenticação não inicializada');
    }
    
    try {
      setLoading(true);
      await signOut(auth);
      setUserData(null);
      
      // Remover o cookie de sessão
      if (typeof document !== 'undefined') {
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
