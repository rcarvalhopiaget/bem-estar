'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Bem-vindo, {user?.email}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Alunos */}
        <Link href="/dashboard/alunos">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-2">Alunos</h2>
            <p className="text-gray-600">Gerencie os alunos cadastrados no sistema.</p>
            <div className="mt-4 text-primary hover:text-primary/80">
              Ver alunos →
            </div>
          </div>
        </Link>

        {/* Card de Refeições */}
        <Link href="/dashboard/refeicoes">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-2">Refeições</h2>
            <p className="text-gray-600">Controle as refeições servidas diariamente.</p>
            <div className="mt-4 text-primary hover:text-primary/80">
              Gerenciar refeições →
            </div>
          </div>
        </Link>

        {/* Card de Relatórios */}
        <Link href="/dashboard/relatorios">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-2">Relatórios</h2>
            <p className="text-gray-600">Acesse relatórios e estatísticas do sistema.</p>
            <div className="mt-4 text-primary hover:text-primary/80">
              Ver relatórios →
            </div>
          </div>
        </Link>
      </div>

      {/* Seção de Atividades Recentes */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-600">Nenhuma atividade recente para exibir.</p>
        </div>
      </div>
    </div>
  );
} 