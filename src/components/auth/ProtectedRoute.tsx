'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const { perfil, isAuthenticated } = usePermissions();
  const { user } = useAuth();
  const router = useRouter();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);

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
      router.push('/login');
      return;
    }

    // Se o usuário for do restaurante e a rota bloqueia usuários do restaurante, redirecionar para o dashboard
    if (isRestauranteUser && blockRestauranteUser) {
      router.push('/dashboard');
      return;
    }

    // Se o perfil não estiver na lista de perfis permitidos, redirecionar para o dashboard
    if (perfil && !allowedProfiles.includes(perfil)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, perfil, router, allowedProfiles, isRestauranteUser, blockRestauranteUser]);

  // Se o usuário não estiver autenticado ou o perfil não for permitido, não renderizar nada
  if (!isAuthenticated || 
      (perfil && !allowedProfiles.includes(perfil)) || 
      (isRestauranteUser && blockRestauranteUser)) {
    return null;
  }

  // Caso contrário, renderizar os filhos normalmente
  return <>{children}</>;
}
