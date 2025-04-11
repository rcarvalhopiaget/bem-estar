'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { 
  Menu, 
  Home, 
  Users,       // Equivalente a People
  Utensils,    // Equivalente a Restaurant
  BarChart3,   // Equivalente a Assessment
  X,           // Equivalente a Close
  User,        // Equivalente a Person
  UserCircle,  // Equivalente a AccountCircle
  CalendarIcon, // Equivalente a Event
  FileEdit     // Ícone para correção de refeições
} from "lucide-react"; // Importa ícones do lucide-react
import { AuthProvider } from '@/contexts/AuthContext'; // Ajuste o caminho
import { NotificationBell } from '@/components/notifications/NotificationBell'; // Importa o sino

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Forçar o redirecionamento usando window.location
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Verifica se o usuário é admin para mostrar a opção de usuários
  const isAdmin = user?.email && [
    'admin@bemestar.com', 
    'teste@teste.com', 
    'rodrigo.carvalho@jpiaget.com.br'
  ].includes(user.email);

  // Verifica se o usuário é operador (restaurante)
  const isOperador = user?.email && user.email.includes('restaurante');

  // Define os itens do menu com base no perfil do usuário
  let menuItems = [
    { href: "/dashboard", label: "Início", icon: <Home className="h-5 w-5" /> },
    { href: "/dashboard/refeicoes-rapidas", label: "Refeições Rápidas", icon: <Utensils className="h-5 w-5" /> },
  ];

  // Adiciona itens adicionais para usuários que não são operadores
  if (!isOperador) {
    menuItems = [
      ...menuItems,
      { href: "/dashboard/alunos", label: "Alunos", icon: <Users className="h-5 w-5" /> },
      { href: "/dashboard/relatorios", label: "Relatórios", icon: <BarChart3 className="h-5 w-5" /> },
      { href: "/dashboard/perfil", label: "Meu Perfil", icon: <UserCircle className="h-5 w-5" /> },
    ];
  }

  // Adiciona a opção de usuários apenas para administradores
  if (isAdmin) {
    menuItems.push({ href: "/dashboard/correcao-refeicoes", label: "Correção de Refeições", icon: <FileEdit className="h-5 w-5" /> });
    menuItems.push({ href: "/dashboard/usuarios", label: "Usuários", icon: <User className="h-5 w-5" /> });
    menuItems.push({ href: "/dashboard/logs", label: "Logs do Sistema", icon: <BarChart3 className="h-5 w-5" /> });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegação superior */}
      <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="Menu principal"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex-shrink-0 flex items-center ml-2">
                <span className="text-2xl font-bold text-primary">BemEstar</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard/perfil" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-primary">
                <UserCircle className="mr-1 h-5 w-5" />
                {user?.displayName || user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para fechar o menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={closeMenu}
        ></div>
      )}

      {/* Menu lateral (drawer) */}
      <div 
        className={`
          fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-xl font-bold text-primary">Menu</span>
          <button 
            onClick={closeMenu}
            className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="flex items-center p-2 text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
                  onClick={closeMenu}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Conteúdo principal */}
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}