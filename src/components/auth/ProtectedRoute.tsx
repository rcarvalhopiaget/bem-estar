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

  // Verificar se o usuário é um email administrativo especial
  const isAdminByEmail = user?.email && [
    'admin@bemestar.com', 
    'teste@teste.com', 
    'rodrigo.carvalho@jpiaget.com.br'
  ].includes(user.email);

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
    // Se o usuário não estiver autenticado, redirecionar para o login
    if (!isAuthenticated) {
      console.log('ProtectedRoute: Usuário não autenticado, redirecionando para login');
      router.push('/login');
      return;
    }

    // Se o usuário for do restaurante e a rota bloqueia usuários do restaurante, redirecionar para o dashboard
    if (isRestauranteUser && blockRestauranteUser) {
      console.log('ProtectedRoute: Usuário do restaurante bloqueado nesta rota, redirecionando para dashboard');
      router.push('/dashboard');
      return;
    }

    // Verificação especial para a página de logs - permitir acesso para administradores por email
    if (isLogsPage && isAdminByEmail) {
      console.log('ProtectedRoute: Acesso à página de logs permitido para admin por email');
      setAuthorized(true);
      return;
    }

    // Se o perfil não estiver na lista de perfis permitidos, redirecionar para o dashboard
    if (perfil && !allowedProfiles.includes(perfil) && !isAdmin) {
      console.log(`ProtectedRoute: Perfil ${perfil} não permitido, redirecionando para dashboard`);
      router.push('/dashboard');
      return;
    }

    // Se chegou até aqui, o usuário está autorizado
    console.log('ProtectedRoute: Usuário autorizado');
    setAuthorized(true);
  }, [isAuthenticated, perfil, isAdmin, router, allowedProfiles, isRestauranteUser, blockRestauranteUser, isLogsPage, isAdminByEmail]);

  // Se o usuário não estiver autenticado ou o perfil não for permitido, não renderizar nada
  if (!isAuthenticated || 
      (perfil && !allowedProfiles.includes(perfil) && !isAdmin && !(isLogsPage && isAdminByEmail)) || 
      (isRestauranteUser && blockRestauranteUser)) {
    console.log('ProtectedRoute: Não renderizando conteúdo protegido');
    return null;
  }

  // Caso contrário, renderizar os filhos normalmente
  console.log('ProtectedRoute: Renderizando conteúdo protegido');
  return <>{children}</>;
}
