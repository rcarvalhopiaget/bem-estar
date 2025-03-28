'use client';

import { useState, useEffect, useCallback } from 'react';
import { Atividade } from '@/types/atividade';
import { atividadeService } from '@/services/atividadeService';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { ptBR } from 'date-fns/locale';

interface AtividadesRecentesProps {
  limite?: number;
  mostrarTitulo?: boolean;
  intervaloAtualizacao?: number; // intervalo em ms
}

export function AtividadesRecentes({ 
  limite = 5, 
  mostrarTitulo = true,
  intervaloAtualizacao = 60000 // atualiza a cada 1 minuto por padrão
}: AtividadesRecentesProps) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  // Função para carregar atividades
  const carregarAtividades = useCallback(async () => {
    try {
      console.log(`Carregando atividades recentes (limite: ${limite})...`);
      setLoading(true);
      
      const atividadesData = await atividadeService.listarAtividades({ limite });
      
      console.log(`${atividadesData.length} atividades carregadas com sucesso.`);
      setAtividades(atividadesData);
      setError(null);
      setUltimaAtualizacao(new Date());
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
  }, [limite]);

  // Carrega atividades na montagem do componente
  useEffect(() => {
    carregarAtividades();
  }, [carregarAtividades]);

  // Configura atualização periódica
  useEffect(() => {
    // Não configurar o intervalo se o valor for 0 ou negativo
    if (intervaloAtualizacao <= 0) return;
    
    const intervalo = setInterval(() => {
      console.log('Atualizando atividades recentes...');
      carregarAtividades();
    }, intervaloAtualizacao);
    
    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalo);
  }, [intervaloAtualizacao, carregarAtividades]);

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

  if (loading && atividades.length === 0) {
    return (
      <div>
        {mostrarTitulo && <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-600">Carregando atividades recentes...</p>
        </div>
      </div>
    );
  }

  if (error && atividades.length === 0) {
    return (
      <div>
        {mostrarTitulo && <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={carregarAtividades}
            className="mt-2 text-blue-500 text-sm underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div>
        {mostrarTitulo && <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-600">Nenhuma atividade recente para exibir.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {mostrarTitulo && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Atividades Recentes</h2>
          <div className="flex items-center text-xs text-gray-500">
            <span className="mr-2">Última atualização: {formatarDataRelativa(ultimaAtualizacao)}</span>
            <button 
              onClick={carregarAtividades} 
              className="text-blue-500 underline"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 relative">
        {loading && atividades.length > 0 && (
          <div className="absolute top-0 left-0 right-0 bg-blue-100 text-blue-800 text-xs text-center py-1">
            Atualizando...
          </div>
        )}
        
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
