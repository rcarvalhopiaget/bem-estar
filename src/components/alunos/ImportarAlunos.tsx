'use client';

import { useState } from 'react';
import { parseCsvToAlunos } from '@/utils/csvParser';
import { alunoService } from '@/services/alunoService';
import { Button } from '@/components/ui/button';

interface ImportarAlunosProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ImportarAlunos({ onSuccess, onCancel }: ImportarAlunosProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ atual: number; total: number } | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setStatus('Lendo arquivo...');

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          console.log('Arquivo lido com sucesso');
          
          setStatus('Processando dados...');
          const alunos = parseCsvToAlunos(content);

          if (alunos.length === 0) {
            throw new Error('Nenhum aluno encontrado no arquivo. Verifique se o formato está correto.');
          }

          setStatus(`Encontrados ${alunos.length} alunos. Iniciando importação...`);
          setProgress({ atual: 0, total: alunos.length });

          for (let i = 0; i < alunos.length; i++) {
            const aluno = alunos[i];
            setStatus(`Importando ${aluno.nome}...`);
            await alunoService.criarOuAtualizarAluno(aluno);
            setProgress({ atual: i + 1, total: alunos.length });
          }

          setStatus('Importação concluída com sucesso!');
          onSuccess();
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          setError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Erro ao ler o arquivo');
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Erro ao importar alunos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao importar alunos');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Importar Alunos</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Selecione o arquivo CSV exportado do Google Forms. O arquivo deve conter as seguintes colunas:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4 ml-4">
            <li>Data/hora</li>
            <li>Endereço de e-mail</li>
            <li>Nome do aluno</li>
            <li>Turma</li>
            <li>Nome do contratante</li>
            <li>Opção desejada (tipo de integral)</li>
          </ul>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/80"
          />
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            {status}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {progress && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-primary rounded transition-all duration-300"
                style={{ width: `${(progress.atual / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Importando aluno {progress.atual} de {progress.total}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
} 