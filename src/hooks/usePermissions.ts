'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/MockAuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';

// Tipos de perfil de usuário
export type PerfilUsuario = 'ADMIN' | 'COORDENADOR' | 'PROFESSOR' | 'OPERADOR';

// Hook simulado para retornar permissões de usuário
export function usePermissions() {
  const { userData } = useAuth();
  
  // Valores padrão para simulação
  const perfil = userData?.perfil || 'admin';
  const isAdmin = perfil === 'admin' || false;
  const isOperador = perfil === 'operador' || false;
  const isProfessor = perfil === 'professor' || false;
  const isCoordenador = perfil === 'coordenador' || false;
  
  return {
    perfil,
    isAdmin,
    isOperador,
    isProfessor,
    isCoordenador,
    hasPermission: (permission: string) => true, // Simulando que tem todas as permissões
  };
}
