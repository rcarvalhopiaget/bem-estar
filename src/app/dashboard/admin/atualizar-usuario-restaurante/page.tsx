'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast-wrapper';
import { useAuth } from '@/contexts/AuthContext';

export default function AtualizarUsuarioRestaurantePage() {
  const { isAdmin } = usePermissions();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verificar se o usuário é administrador
    if (user?.email === 'rodrigo.carvalho@jpiaget.com.br' || user?.email === 'admin@bemestar.com') {
      setIsAuthorized(true);
    } else {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleAtualizarUsuario = async () => {
    try {
      setIsLoading(true);
      setResultado(null);

      // Criar ou atualizar o usuário diretamente no cliente
      const novoUsuario = {
        nome: 'Taina Soares',
        email: 'restaurante.piaget@jpiaget.com.br',
        perfil: 'OPERADOR',
        ativo: true,
        cargo: 'Operador de Restaurante',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Enviar para a API
      const response = await fetch('/api/atualizar-usuario-restaurante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoUsuario)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setResultado(`Operação concluída com sucesso: ${data.message} (ID: ${data.id})`);
      } else {
        toast.error(data.message);
        setResultado(`Erro: ${data.message} - ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      setResultado(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Verificando permissões...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Atualizar Usuário do Restaurante</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Email:</strong> restaurante.piaget@jpiaget.com.br</p>
            <p><strong>Nome:</strong> Taina Soares</p>
            <p><strong>Cargo:</strong> Operador de Restaurante</p>
            <p><strong>Perfil:</strong> OPERADOR</p>
            <p><strong>Status:</strong> Ativo</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col space-y-4">
        <Button 
          onClick={handleAtualizarUsuario} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar Usuário do Restaurante'}
        </Button>

        {resultado && (
          <div className={`p-4 rounded-lg ${resultado.includes('Erro') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {resultado}
          </div>
        )}

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Instruções</h3>
          <p>Esta página permite atualizar o usuário do restaurante (Taina Soares) para garantir que:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>O perfil seja definido como OPERADOR</li>
            <li>O status da conta seja ATIVO</li>
            <li>As informações estejam corretas no sistema</li>
          </ul>
          <p className="mt-2">Após a atualização, o usuário poderá fazer login normalmente e terá acesso apenas às refeições rápidas.</p>
        </div>
      </div>
    </div>
  );
}
