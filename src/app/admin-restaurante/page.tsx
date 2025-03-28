'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getFirestore } from 'firebase/firestore';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function AdminRestaurantePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [usuarioAtualizado, setUsuarioAtualizado] = useState(false);

  const handleAtualizarUsuario = async () => {
    try {
      setIsLoading(true);
      setResultado(null);

      // Verificar se o db está disponível
      if (!db) {
        setResultado("Erro: Banco de dados não está disponível no momento");
        toast.error("Erro ao conectar ao banco de dados");
        return;
      }

      // Buscar o usuário pelo email
      const email = 'restaurante.piaget@jpiaget.com.br';
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Atualizar o usuário existente
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, 'usuarios', docId);
        
        await updateDoc(docRef, {
          nome: 'Taina Soares',
          perfil: 'OPERADOR',
          ativo: true,
          cargo: 'Operador de Restaurante',
          updatedAt: new Date()
        });
        
        setResultado(`Usuário atualizado com sucesso! ID: ${docId}`);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar um novo usuário
        const novoUsuarioRef = doc(collection(db, 'usuarios'));
        await setDoc(novoUsuarioRef, {
          nome: 'Taina Soares',
          email: 'restaurante.piaget@jpiaget.com.br',
          perfil: 'OPERADOR',
          ativo: true,
          cargo: 'Operador de Restaurante',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        setResultado(`Novo usuário criado com sucesso! ID: ${novoUsuarioRef.id}`);
        toast.success('Novo usuário criado com sucesso!');
      }
      
      setUsuarioAtualizado(true);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      setResultado(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
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

        {usuarioAtualizado && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Próximos Passos</h3>
            <p>O usuário Taina Soares foi atualizado com sucesso. Agora você pode:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fazer logout e login novamente com o usuário do restaurante</li>
              <li>Verificar se o usuário aparece corretamente na gestão de usuários</li>
              <li>Confirmar que o usuário tem acesso apenas às refeições rápidas</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
