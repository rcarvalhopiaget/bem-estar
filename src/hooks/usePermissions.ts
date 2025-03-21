'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';

// Tipos de perfil de usuário
export type PerfilUsuario = 'ADMIN' | 'COORDENADOR' | 'PROFESSOR' | 'OPERADOR';

export function usePermissions() {
  const { user, userData } = useAuth();
  const { isVerified } = useEmailVerification();
  const [canWrite, setCanWrite] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    // Usuário precisa estar autenticado e com email verificado para ter permissões de escrita
    setCanWrite(!!user && isVerified);
    
    // Definir o perfil do usuário
    if (userData?.perfil) {
      setPerfil(userData.perfil as PerfilUsuario);
    } else {
      setPerfil(null);
    }
  }, [user, isVerified, userData]);

  // Verificar se o usuário é admin
  const isAdmin = perfil === 'ADMIN';
  
  // Verificar se o usuário é coordenador
  const isCoordenador = perfil === 'COORDENADOR' || isAdmin;
  
  // Verificar se o usuário é professor
  const isProfessor = perfil === 'PROFESSOR' || isCoordenador;
  
  // Verificar se o usuário é operador
  const isOperador = perfil === 'OPERADOR' || isProfessor;

  return {
    // Permissões básicas
    canWrite,
    isAuthenticated: !!user,
    isEmailVerified: isVerified,
    
    // Perfil do usuário
    perfil,
    
    // Verificações de perfil
    isAdmin,
    isCoordenador,
    isProfessor,
    isOperador,
    
    // Permissões específicas
    podeGerenciarUsuarios: isCoordenador,
    podeGerenciarAlunos: isCoordenador,
    podeGerenciarRefeicoes: isOperador,
    podeVisualizarRelatorios: isProfessor,
    podeGerenciarConfiguracoes: isAdmin,
    
    // Verificação genérica de permissão
    hasPermission: canWrite
  };
}
