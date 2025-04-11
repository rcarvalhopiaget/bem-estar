'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Tipos de perfil de usuário
export type PerfilUsuario = 'ADMIN' | 'COORDENADOR' | 'PROFESSOR' | 'OPERADOR';

// Hook para retornar permissões de usuário
export function usePermissions() {
  const { user, userData } = useAuth();
  
  // Verificação de autenticação
  const isAuthenticated = user !== null;
  
  // Verificação de email (sempre true para evitar a necessidade de verificação)
  const isEmailVerified = true;
  
  // Log para depuração
  useEffect(() => {
    console.log('usePermissions:', {
      isAuthenticated,
      user: user ? { email: user.email, uid: user.uid } : null,
      userData
    });
  }, [isAuthenticated, user, userData]);
  
  // Normalizando perfil: converter para maiúsculas e tratar casos especiais
  const perfil = userData?.perfil ? 
                 userData.perfil.toUpperCase() : 
                 'ADMIN'; // Valor padrão para desenvolvimento
  
  // Verificar perfis específicos
  const isAdmin = perfil === 'ADMIN' || perfil === 'admin';
  const isOperador = perfil === 'OPERADOR' || perfil === 'operador';
  const isProfessor = perfil === 'PROFESSOR' || perfil === 'professor';
  const isCoordenador = perfil === 'COORDENADOR' || perfil === 'coordenador';
  
  // Permissões específicas
  const podeGerenciarConfiguracoes = isAdmin || isCoordenador;
  
  // Permissão de escrita (compatibilidade com código legado)
  const canWrite = isAuthenticated && (isAdmin || isOperador || isProfessor);
  
  // Retorna todas as permissões relevantes
  return {
    isAuthenticated,
    perfil,
    isAdmin,
    isOperador,
    isProfessor,
    isCoordenador,
    podeGerenciarConfiguracoes,
    canWrite,
    isEmailVerified,
    hasPermission: (permission: string) => true, // Simulando que tem todas as permissões
  };
}
