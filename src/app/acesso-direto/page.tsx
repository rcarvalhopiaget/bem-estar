'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AcessoDireto() {
  const router = useRouter();

  const acessarDashboard = () => {
    // Armazenar um flag para simular que está autenticado
    localStorage.setItem('usuarioAutenticado', JSON.stringify({
      id: '1',
      nome: 'Administrador',
      email: 'admin@example.com',
      autenticado: true
    }));
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Acesso Direto</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Esta é uma página temporária para permitir acesso ao sistema sem autenticação 
        enquanto resolvemos os problemas técnicos.
      </p>
      
      <Button 
        onClick={acessarDashboard}
        className="w-full max-w-xs py-6 text-lg"
      >
        Acessar como Administrador
      </Button>
    </div>
  );
} 