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
import { useLogService } from '@/services/logService';

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
  const { logAction } = useLogService();

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

  // Função para chamar a API de sessão
  const manageSession = async (action: 'login' | 'logout') => {
    if (action === 'login') {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('[manageSession] Tentativa de login na sessão sem usuário Firebase ativo.');
        return;
      }
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch('/api/auth/session/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ idToken }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          console.error('[manageSession] Falha ao criar cookie de sessão:', result.error || response.statusText);
          // Opcional: Deslogar usuário Firebase se a criação da sessão falhar?
        } else {
          console.log('[manageSession] Cookie de sessão criado com sucesso.');
        }
      } catch (error) {
        console.error('[manageSession] Erro ao chamar API de login da sessão:', error);
      }
    } else if (action === 'logout') {
      try {
        const response = await fetch('/api/auth/session/logout', {
          method: 'POST',
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          console.error('[manageSession] Falha ao limpar cookie de sessão:', result.error || response.statusText);
        } else {
          console.log('[manageSession] Cookie de sessão limpo com sucesso.');
        }
      } catch (error) {
        console.error('[manageSession] Erro ao chamar API de logout da sessão:', error);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      console.error('Auth não está inicializado');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
        // **IMPORTANTE:** Criar/Validar sessão quando o estado muda para logado
        await manageSession('login');
      } else {
        setUserData(null);
        // **IMPORTANTE:** Limpar sessão quando o estado muda para deslogado
        // Não precisa chamar se o logout já faz isso, mas garante limpeza em outros casos (ex: token expirado)
        await manageSession('logout');
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
    
    let loggedInUser: User | null = null;
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      loggedInUser = result.user;
      await fetchUserData(result.user.uid);
      
      // Log de Login bem-sucedido
      await logAction('LOGIN', 'AUTH', `Usuário ${email} logado com sucesso.`); 
      
      return result.user;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // Log de falha no Login
      await logAction('ERROR', 'AUTH', `Falha no login para ${email}`, { error: error?.message, code: error?.code });
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
      // Log de SignUp (Criação de usuário)
      await logAction('CREATE', 'AUTH', `Usuário ${email} criado com sucesso.`, { userId: result.user.uid });
      // Não precisa chamar fetchUserData aqui, onAuthStateChanged fará isso.
      // O manageSession('login') será chamado pelo onAuthStateChanged
      return result.user;
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
       await logAction('ERROR', 'AUTH', `Falha ao criar conta para ${email}`, { error: error?.message, code: error?.code });
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
    
    const userBeforeLogout = user;
    try {
      setLoading(true);
      // Log de Logout ANTES de deslogar
      if (userBeforeLogout) {
        await logAction('LOGOUT', 'AUTH', `Usuário ${userBeforeLogout.email} deslogado.`);
      }
      await manageSession('logout');
      await signOut(auth);
      setUserData(null);
      
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      // Log de falha no Logout
      if (userBeforeLogout) { // Tenta logar erro associado ao usuário que tentou deslogar
         await logAction('ERROR', 'AUTH', `Falha ao deslogar usuário ${userBeforeLogout.email}`, { error: error?.message });
      }
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
