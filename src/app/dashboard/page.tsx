'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AtividadesRecentes } from '@/components/atividades/AtividadesRecentes';

export default function DashboardPage() {
  const { user } = useAuth();

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
      </div>

      {/* Seção de Atividades Recentes */}
      <div className="mt-8">
        <AtividadesRecentes limite={10} mostrarTitulo={true} />
      </div>
    </div>
  );
}