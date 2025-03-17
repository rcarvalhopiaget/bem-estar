'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string[]>([]);

  const handleLimparDuplicados = async () => {
    if (!confirm('Tem certeza que deseja limpar os alunos duplicados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    setResultado([]);
    
    try {
      console.log('Iniciando processo de limpeza...');
      const response = await fetch('/api/admin/limpar-duplicados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        // Verificar se a resposta tem conteúdo antes de tentar parsear
        const text = await response.text();
        console.log('Resposta bruta recebida:', text);
        
        if (text && text.trim() !== '') {
          data = JSON.parse(text);
          console.log('Resposta parseada:', data);
        } else {
          console.warn('Resposta vazia recebida do servidor');
          data = { resultados: ['Resposta vazia recebida do servidor'], totalProcessados: 0 };
        }
      } catch (e) {
        console.error('Erro ao parsear resposta:', e instanceof Error ? e.message : JSON.stringify(e));
        throw new Error('Erro ao processar resposta do servidor. Verifique o console para detalhes.');
      }
      
      if (!response.ok) {
        if (data?.error && data.error.includes('Configuração do Firebase Admin SDK incompleta')) {
          // Erro específico de configuração do Firebase
          toast.error('Erro de configuração do sistema. Contate o administrador.');
          setResultado([data.error]);
          return;
        }
        throw new Error(data?.error || 'Erro ao processar a limpeza');
      }
      
      // Se não houver resultados, cria um array vazio
      if (!data || !data.resultados) {
        console.warn('Resposta sem dados de resultado:', data);
        data = { resultados: ['Operação concluída, mas sem resultados detalhados.'], totalProcessados: 0 };
      }
      
      // Garante que resultados é um array
      if (!Array.isArray(data.resultados)) {
        console.error('Formato inválido de resultados:', data);
        data.resultados = [String(data.resultados || 'Formato inválido de resposta do servidor')];
      }

      setResultado(data.resultados);
      
      const mensagem = data.totalProcessados > 0
        ? `Limpeza concluída! ${data.totalProcessados} registros processados.`
        : 'Nenhum registro duplicado encontrado.';
      
      toast.success(mensagem);
    } catch (error) {
      console.error('Erro durante limpeza:', error instanceof Error ? error.message : JSON.stringify(error));
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido ao executar a limpeza';
      toast.error(mensagemErro);
      setResultado(['Erro: ' + mensagemErro]);
      
      // Registra informações adicionais para depuração
      try {
        const navigatorInfo = {
          online: navigator.onLine,
          userAgent: navigator.userAgent
        };
        console.log('Informações adicionais para depuração:', navigatorInfo);
      } catch (e) {
        console.error('Erro ao coletar informações adicionais:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Limpeza de Alunos Duplicados</h2>
        <p className="text-gray-600 mb-4">
          Esta ferramenta irá:
          <ul className="list-disc ml-6 mt-2">
            <li>Identificar alunos com a mesma matrícula</li>
            <li>Manter ativo apenas o registro mais recente</li>
            <li>Marcar os registros antigos como inativos</li>
            <li>Preservar todo o histórico de refeições</li>
          </ul>
        </p>

        <Button
          onClick={handleLimparDuplicados}
          disabled={loading}
          className="w-full md:w-auto text-lg p-4"
        >
          {loading ? 'Processando...' : 'Limpar Duplicados'}
        </Button>

        {resultado.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Resultado da Limpeza:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {resultado.join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
