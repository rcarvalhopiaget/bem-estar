'use client';

import { useEffect, useState } from 'react';
import { restauranteService } from '@/services/restauranteService';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/use-toast';

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

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  const carregarConfiguracao = async () => {
    try {
      setLoading(true);
      setError('');
      const config = await restauranteService.buscarConfiguracao() as RestauranteConfig;
      if (config) {
        setNome(config.nome);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      setError('Erro ao carregar configuração do restaurante');
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração do restaurante",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracao = async () => {
    try {
      setLoading(true);
      setError('');
      await restauranteService.atualizarConfiguracao({ nome });
      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      setError('Erro ao salvar configuração do restaurante');
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração do restaurante",
        variant: "destructive"
      });
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome do Restaurante
              </label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do restaurante"
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