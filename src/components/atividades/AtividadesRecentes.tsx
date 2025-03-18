'use client';

import { useState, useEffect } from 'react';
import { Atividade } from '@/types/atividade';
import { atividadeService } from '@/services/atividadeService';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { ptBR } from 'date-fns/locale';

interface AtividadesRecentesProps {
  limite?: number;
  mostrarTitulo?: boolean;
}

export function AtividadesRecentes({ limite = 5, mostrarTitulo = true }: AtividadesRecentesProps) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarAtividades = async () => {
      try {
        setLoading(true);
        const atividadesData = await atividadeService.listarAtividades({ limite });
        setAtividades(atividadesData);
        setError(null);
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        
        // Não mostra erro de permissão para o usuário, apenas exibe uma mensagem genérica
        if (error instanceof Error && 
            (error.message.includes('permission-denied') || 
             error.message.includes('Usuário não autenticado'))) {
          setError('Nenhuma atividade disponível no momento.');
        } else {
          setError('Erro ao carregar atividades. Tente novamente mais tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    carregarAtividades();
  }, [limite]);

  // Função para formatar a data relativa (ex: "há 5 minutos")
  const formatarDataRelativa = (data: Date) => {
    return formatDistanceToNow(data, { addSuffix: true, locale: ptBR });
  };

  // Função para obter o ícone com base no tipo de atividade
  const obterIcone = (tipo: string) => {
    switch (tipo) {
      case 'REFEICAO':
        return '🍽️';
      case 'ALUNO':
        return '👤';
      case 'SISTEMA':
        return '⚙️';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Carregando atividades recentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Nenhuma atividade recente para exibir.</p>
      </div>
    );
  }

  return (
    <div>
      {mostrarTitulo && <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {atividades.map((atividade) => (
            <li key={atividade.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <span className="text-2xl mr-3">{obterIcone(atividade.tipo)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {atividade.descricao}
                  </p>
                  <p className="text-xs text-gray-500">
                    {atividade.usuarioEmail} • {formatarDataRelativa(atividade.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
