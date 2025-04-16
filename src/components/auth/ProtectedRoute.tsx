'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedProfiles?: string[];
  blockRestauranteUser?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedProfiles = ['ADMIN', 'COORDENADOR', 'PROFESSOR'],
  blockRestauranteUser = true
}: ProtectedRouteProps) {
  const { perfil, isAuthenticated, isAdmin } = usePermissions();
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Lista de emails administrativos especiais
  const adminEmails = [
    'rodrigo.carvalho@jpiaget.com.br',
    'adriana.diari@jpiaget.com.br',
    'admin@bemestar.com',
    'teste@teste.com'
  ];
  
  // Verificar se o usuário é um email administrativo especial
  const isAdminByEmail = user?.email && adminEmails.includes(user.email);

  // Verificar se a rota atual é a página de logs
  const isLogsPage = pathname?.includes('/dashboard/logs');

  // Log para depuração
  useEffect(() => {
    console.log('ProtectedRoute Estado:', {
      isAuthenticated,
      perfil,
      userEmail: user?.email,
      isAdminByEmail,
      isAdmin,
      isLogsPage,
      pathname,
      userData,
      allowedProfiles,
      isRestauranteUser,
      blockRestauranteUser
    });
  }, [isAuthenticated, perfil, user, isAdminByEmail, isAdmin, isLogsPage, pathname, userData, allowedProfiles, isRestauranteUser, blockRestauranteUser]);

  useEffect(() => {
    // Verificar se o email do usuário contém "restaurante"
    if (user?.email && user.email.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('ProtectedRoute: É usuário do restaurante!');
    }
  }, [user]);

  useEffect(() => {
    // Função para verificar autorização
    const checkAuthorization = () => {
      if (!isAuthenticated) {
        console.log('ProtectedRoute: Usuário não autenticado, redirecionando...');
        setAuthorized(false);
        router.push('/login');
        return;
      }

      // Permitir acesso direto para usuários com emails administrativos
      if (isAdminByEmail) {
        console.log('ProtectedRoute: Acesso concedido por email administrativo');
        setAuthorized(true);
        return;
      }

      // Verificar se o perfil do usuário está na lista de perfis permitidos
      // perfil pode ser uma string ou um array de strings
      const profileAllowed = 
        Array.isArray(allowedProfiles) 
          ? allowedProfiles.includes(perfil as string)
          : allowedProfiles === perfil;

      // Restrição especial para a página de logs - apenas admins
      if (isLogsPage && !isAdmin) {
        console.log('ProtectedRoute: Acesso negado à página de logs (não é admin)');
        setAuthorized(false);
        router.push('/dashboard');
        return;
      }

      // Bloqueio para usuários do restaurante
      if (blockRestauranteUser && isRestauranteUser) {
        console.log('ProtectedRoute: Acesso negado para usuário do restaurante');
        setAuthorized(false);
        router.push('/dashboard');
        return;
      }

      // Decisão final
      setAuthorized(!!(profileAllowed || isAdmin));
      
      if (!(profileAllowed || isAdmin)) {
        console.log('ProtectedRoute: Perfil não autorizado, redirecionando...');
        router.push('/dashboard');
      }
    };

    // Executar a verificação
    checkAuthorization();
  }, [allowedProfiles, perfil, isAdmin, isAuthenticated, isRestauranteUser, isAdminByEmail, blockRestauranteUser, isLogsPage, router]);

  return authorized ? <>{children}</> : null;
}
