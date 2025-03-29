'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getFirestore } from 'firebase/firestore';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { upsertRestauranteUser } from '@/actions/adminActions';

export default function AdminRestaurantePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [usuarioAtualizado, setUsuarioAtualizado] = useState(false);

  const handleAtualizarUsuario = async () => {
    setIsLoading(true);
    setResultado(null);
    setUsuarioAtualizado(false);

    const result = await upsertRestauranteUser();

    if (result.success) {
      setResultado(result.message);
      toast.success('Operação concluída com sucesso!');
      setUsuarioAtualizado(true);
    } else {
      setResultado(`Erro: ${result.message}`);
      toast.error(`Erro: ${result.message}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Administração do Usuário do Restaurante</h1>
        <Link href="/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Usuário (Pré-definidas)</CardTitle>
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
          {isLoading ? 'Processando...' : 'Garantir/Atualizar Usuário do Restaurante'}
        </Button>

        {resultado && (
          <div className={`p-4 rounded-lg ${resultado.includes('Erro') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {resultado}
          </div>
        )}

        {usuarioAtualizado && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Usuário Criado/Atualizado</h3>
            <p>O usuário Taina Soares foi criado ou atualizado no Firestore.</p>
          </div>
        )}
      </div>
    </div>
  );
}
