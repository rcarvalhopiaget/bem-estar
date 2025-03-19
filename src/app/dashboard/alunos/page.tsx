'use client';

import { useState, useEffect } from 'react';
import { Aluno, AlunoFormData } from '@/types/aluno';
import { alunoService } from '@/services/alunoService';
import { AlunoForm } from '@/components/alunos/AlunoForm';
import { ImportarAlunos } from '@/components/alunos/ImportarAlunos';
import { Button } from '@/components/ui/button';

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<Aluno | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportacao, setMostrarImportacao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(true); // Inicialmente mostra apenas ativos

  // Carregar lista de alunos
  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setError(null); // Limpa erros anteriores
      console.log('Iniciando carregamento de alunos com filtro:', { ativo: filtroAtivo });
      const data = await alunoService.listarAlunos({ ativo: filtroAtivo });
      console.log('Alunos carregados:', data);
      setAlunos(data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      if (error instanceof Error) {
        setError(`Erro ao carregar alunos: ${error.message}`);
      } else {
        setError('Erro ao carregar alunos. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAlunos();
  }, [filtroAtivo]);

  // Criar novo aluno
  const handleCriarAluno = async (dados: AlunoFormData) => {
    try {
      await alunoService.criarOuAtualizarAluno(dados);
      setMostrarFormulario(false);
      carregarAlunos();
    } catch (error) {
      setError('Erro ao criar aluno');
      console.error(error);
    }
  };

  // Atualizar aluno
  const handleAtualizarAluno = async (dados: AlunoFormData) => {
    if (!alunoEmEdicao) return;
    
    try {
      await alunoService.atualizarAluno(alunoEmEdicao.id, dados);
      setAlunoEmEdicao(null);
      carregarAlunos();
    } catch (error) {
      setError('Erro ao atualizar aluno');
      console.error(error);
    }
  };

  // Excluir aluno
  const handleExcluirAluno = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este aluno?')) return;
    
    try {
      await alunoService.excluirAluno(id);
      carregarAlunos();
    } catch (error) {
      setError('Erro ao excluir aluno');
      console.error(error);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Alunos</h1>
        <div className="space-x-4">
          <Button variant="primary" onClick={() => setMostrarImportacao(true)}>
            Importar Alunos
          </Button>
          <Button variant="primary" onClick={() => setMostrarFormulario(true)}>
            Novo Aluno
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtro de status */}
      <div className="mb-6 flex items-center">
        <span className="mr-3 font-medium">Filtrar por status:</span>
        <div className="flex space-x-2">
          <Button 
            variant={filtroAtivo === true ? "primary" : "outline"}
            onClick={() => setFiltroAtivo(true)}
            className="px-4 py-2"
          >
            Ativos
          </Button>
          <Button 
            variant={filtroAtivo === false ? "primary" : "outline"}
            onClick={() => setFiltroAtivo(false)}
            className="px-4 py-2"
          >
            Inativos
          </Button>
          <Button 
            variant={filtroAtivo === undefined ? "primary" : "outline"}
            onClick={() => setFiltroAtivo(undefined)}
            className="px-4 py-2"
          >
            Todos
          </Button>
        </div>
        <div className="ml-4 text-sm text-gray-500">
          {filtroAtivo === true && 'Mostrando apenas alunos ativos'}
          {filtroAtivo === false && 'Mostrando apenas alunos inativos'}
          {filtroAtivo === undefined && 'Mostrando todos os alunos'}
          {alunos.length > 0 && ` (${alunos.length} encontrados)`}
        </div>
      </div>

      {mostrarImportacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ImportarAlunos
            onSuccess={() => {
              setMostrarImportacao(false);
              carregarAlunos();
            }}
            onCancel={() => setMostrarImportacao(false)}
          />
        </div>
      )}

      {(mostrarFormulario || alunoEmEdicao) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {alunoEmEdicao ? 'Editar Aluno' : 'Novo Aluno'}
            </h2>
            <AlunoForm
              aluno={alunoEmEdicao || undefined}
              onSubmit={alunoEmEdicao ? handleAtualizarAluno : handleCriarAluno}
              onCancel={() => {
                setMostrarFormulario(false);
                setAlunoEmEdicao(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matrícula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turma
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {aluno.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {aluno.matricula}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {aluno.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {aluno.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {aluno.turma}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    aluno.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {aluno.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setAlunoEmEdicao(aluno)}
                    className="text-primary hover:text-primary/80 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluirAluno(aluno.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 