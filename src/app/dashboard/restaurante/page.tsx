'use client';

import { useEffect, useState } from 'react';
import { restauranteService } from '@/services/restauranteService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface RestauranteConfig {
  id?: string;
  nome: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function RestaurantePage() {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  useEffect(() => {
    const carregarConfiguracao = async () => {
      try {
        if (!db) {
          handleError('Erro ao conectar ao banco de dados');
          return;
        }

        const docRef = doc(db, 'configuracoes', 'restaurante');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          handleError('Configuração do restaurante não encontrada');
          return;
        }

        const data = docSnap.data();
        setNome(data.nome);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        handleError('Erro ao carregar configuração do restaurante');
      } finally {
        setLoading(false);
      }
    };

    carregarConfiguracao();
  }, []);

  const salvarConfiguracao = async () => {
    try {
      setLoading(true);
      setError('');
      await restauranteService.atualizarConfiguracao({ nome });
      toast.success("Configuração salva com sucesso!");
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      handleError('Erro ao salvar configuração do restaurante');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Configuração do Restaurante</h2>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome do Restaurante
              </label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome do restaurante"
                className="mt-1"
              />
            </div>
            <Button
              onClick={salvarConfiguracao}
              disabled={loading}
              className="w-full"
            >
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}