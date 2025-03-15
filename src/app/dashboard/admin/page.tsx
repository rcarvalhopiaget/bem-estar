'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string[]>([]);

  const handleLimparDuplicados = async () => {
    if (!confirm('Tem certeza que deseja limpar os alunos duplicados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/limpar-duplicados', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar a limpeza');
      }

      setResultado(data.resultados || []);
      toast.success(`Limpeza concluída! ${data.totalProcessados} registros processados.`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao executar a limpeza de duplicados');
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
