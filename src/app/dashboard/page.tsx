'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AtividadesRecentes } from '@/components/atividades/AtividadesRecentes';
import { usePermissions } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const { perfil, isOperador, isProfessor, isCoordenador, isAdmin } = usePermissions();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    console.log('Perfil do usuário:', perfil);
    console.log('userData:', userData);
    console.log('É operador?', isOperador);
    console.log('É administrador?', isAdmin);
    console.log('Email do usuário:', user?.email);
    
    // Verificar se o email do usuário é de administrador
    if (user?.email && (
      user.email === 'admin@bemestar.com' || 
      user.email === 'teste@teste.com' || 
      user.email === 'rodrigo.carvalho@jpiaget.com.br'
    )) {
      setIsAdminUser(true);
      console.log('É administrador por email!');
    }
    
    // Verificar se o email do usuário contém "restaurante"
    if (user?.email && user.email.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('É usuário do restaurante!');
    }
  }, [perfil, userData, isOperador, isAdmin, user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Bem-vindo, {user?.email}!
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Refeições Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/refeicoes-rapidas">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Mostrar opções adicionais apenas para usuários que não são do restaurante */}
        {!isRestauranteUser && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Importar Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/alunos/importar">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/alunos">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/relatorios">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>

            {(isAdmin || isAdminUser) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Logs do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/logs">
                    <Button className="w-full">Acessar</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Mostrar opção de atualização do usuário do restaurante apenas para administradores */}
            {(isAdmin || isAdminUser) && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Atualizar Usuário Restaurante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard/admin/atualizar-usuario-restaurante">
                      <Button className="w-full">Acessar</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Verificar Usuários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard/admin/verificar-usuarios">
                      <Button className="w-full">Acessar</Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* Seção de Atividades Recentes */}
      {!isRestauranteUser && (
        <div className="mt-8">
          <AtividadesRecentes limite={10} mostrarTitulo={true} />
        </div>
      )}
    </div>
  );
}