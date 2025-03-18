'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Menu as MenuIcon } from "@mui/icons-material";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Forçar o redirecionamento usando window.location
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegação superior */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-2 p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <MenuIcon />
              </button>
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
        <div className="flex flex-col md:flex-row">
          {/* Overlay para fechar o menu em dispositivos móveis */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
              onClick={toggleSidebar}
            ></div>
          )}

          {/* Barra lateral */}
          <div 
            className={`
              fixed md:relative z-30 bg-white shadow-lg rounded-lg p-4 md:mr-6 transition-all duration-300 ease-in-out
              ${sidebarOpen ? 'left-0' : '-left-64'} 
              md:left-0 w-64 h-screen md:h-auto
            `}
          >
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/dashboard/alunos"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                Alunos
              </Link>
              <Link
                href="/dashboard/refeicoes-rapidas"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                Refeições Rápidas
              </Link>
              <Link
                href="/dashboard/relatorios"
                className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                Relatórios
              </Link>
            </nav>
          </div>

          {/* Área de conteúdo */}
          <div className="flex-1 bg-white shadow-lg rounded-lg p-6 mt-4 md:mt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}