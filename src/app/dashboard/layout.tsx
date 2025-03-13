'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Forçar o redirecionamento usando window.location
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegação superior */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary">BemEstar</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Barra lateral */}
          <div className="w-64 bg-white shadow-lg rounded-lg p-4 mr-6">
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
              >
                Início
              </Link>
              <Link
                href="/dashboard/alunos"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
              >
                Alunos
              </Link>
              <Link
                href="/dashboard/refeicoes-rapidas"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
              >
                Refeições Rápidas
              </Link>
              <Link
                href="/dashboard/relatorios"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
              >
                Relatórios
              </Link>
            </nav>
          </div>

          {/* Área de conteúdo */}
          <div className="flex-1 bg-white shadow-lg rounded-lg p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}