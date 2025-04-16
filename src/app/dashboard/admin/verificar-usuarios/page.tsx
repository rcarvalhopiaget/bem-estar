'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Typography, Box, Paper, Divider, CircularProgress } from '@mui/material';
import { query, where, doc, updateDoc } from 'firebase/firestore';

interface Usuario {
  id: string;
  nome?: string;
  email?: string;
  perfil?: string;
  ativo?: boolean;
  cargo?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function VerificarUsuariosPage() {
  const { isAdmin } = usePermissions();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verificar se o usuário é administrador
    if (user?.email === 'rodrigo.carvalho@jpiaget.com.br' || 
        user?.email === 'adriana.diari@jpiaget.com.br' || 
        user?.email === 'admin@bemestar.com') {
      setIsAuthorized(true);
      carregarUsuarios();
    } else {
      router.push('/dashboard');
    }
  }, [user, router]);

  const carregarUsuarios = async () => {
    try {
      // Verificar se o banco de dados está disponível
      if (!db) {
        toast?.error?.("Erro ao conectar ao banco de dados");
        return;
      }

      setIsLoading(true);
      
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      
      const listaUsuarios: Usuario[] = [];
      
      snapshot.forEach((doc) => {
        listaUsuarios.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsuarios(listaUsuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (data: any) => {
    if (!data) return 'N/A';
    
    try {
      if (data.toDate) {
        return data.toDate().toLocaleString('pt-BR');
      }
      
      if (data.seconds) {
        return new Date(data.seconds * 1000).toLocaleString('pt-BR');
      }
      
      return 'Formato desconhecido';
    } catch (error) {
      return 'Erro ao formatar data';
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Verificar Usuários</h2>
        <Button 
          onClick={carregarUsuarios} 
          disabled={isLoading}
        >
          {isLoading ? 'Carregando...' : 'Atualizar Lista'}
        </Button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          {isLoading ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className={usuario.email?.includes('restaurante') ? 'border-2 border-blue-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                  <span>{usuario.nome || 'Sem nome'}</span>
                  <span className={`text-sm px-2 py-1 rounded ${usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>ID:</strong> {usuario.id}</p>
                  <p><strong>Email:</strong> {usuario.email || 'N/A'}</p>
                  <p><strong>Perfil:</strong> {usuario.perfil || 'Não definido'}</p>
                  <p><strong>Cargo:</strong> {usuario.cargo || 'N/A'}</p>
                  <p><strong>Criado em:</strong> {formatarData(usuario.createdAt)}</p>
                  <p><strong>Atualizado em:</strong> {formatarData(usuario.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/dashboard/admin/atualizar-usuario-restaurante')}
              className="w-full"
            >
              Ir para Atualização do Usuário do Restaurante
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
