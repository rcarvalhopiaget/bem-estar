'use client';

import { useState, useEffect } from 'react';
import { Aluno, AlunoFormData } from '@/types/aluno';
import { alunoService } from '@/services/alunoService';
import { AlunoForm } from '@/components/alunos/AlunoForm';
import { ImportarAlunos } from '@/components/alunos/ImportarAlunos';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLogService } from '@/services/logService';
import { useToast } from '@/components/ui/use-toast';

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<Aluno | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportacao, setMostrarImportacao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(true); // Inicialmente mostra apenas ativos
  const { logAction } = useLogService();
  const { toast } = useToast();

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
      const alunoId = await alunoService.criarOuAtualizarAluno(dados);
      toast({ title: 'Sucesso', description: `Aluno ${dados.nome} criado com sucesso.` });
      await logAction('CREATE', 'ALUNOS', `Aluno ${dados.nome} (${dados.matricula}) criado.`, { alunoId });
      setMostrarFormulario(false);
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao criar aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao criar aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao criar aluno ${dados.nome}`, { error: error?.message, dados });
      console.error(error);
    }
  };

  // Atualizar aluno
  const handleAtualizarAluno = async (dados: AlunoFormData) => {
    if (!alunoEmEdicao) return;
    const alunoId = alunoEmEdicao.id;
    
    try {
      await alunoService.atualizarAluno(alunoId, dados);
      toast({ title: 'Sucesso', description: `Aluno ${dados.nome} atualizado com sucesso.` });
      await logAction('UPDATE', 'ALUNOS', `Aluno ${dados.nome} (${dados.matricula}) atualizado.`, { alunoId, dados });
      setAlunoEmEdicao(null);
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao atualizar aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao atualizar aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao atualizar aluno ${dados.nome} (ID: ${alunoId})`, { error: error?.message, dados });
      console.error(error);
    }
  };

  // Excluir aluno
  const handleExcluirAluno = async (aluno: Aluno) => {
    if (!window.confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?`)) return;
    const { id: alunoId, nome, matricula } = aluno;
    
    try {
      await alunoService.excluirAluno(alunoId);
      toast({ title: 'Sucesso', description: `Aluno ${nome} excluído com sucesso.` });
      await logAction('DELETE', 'ALUNOS', `Aluno ${nome} (${matricula}) excluído.`, { alunoId });
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao excluir aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao excluir aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao excluir aluno ${nome} (ID: ${alunoId})`, { error: error?.message });
      console.error(error);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <ProtectedRoute allowedProfiles={['ADMIN', 'COORDENADOR', 'PROFESSOR']}>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciamento de Alunos</h1>
          <div className="space-x-4">
            <Button variant="default" onClick={() => setMostrarImportacao(true)}>
              Importar Alunos
            </Button>
            <Button variant="default" onClick={() => setMostrarFormulario(true)}>
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
              variant={filtroAtivo === true ? "default" : "outline"}
              onClick={() => setFiltroAtivo(true)}
              className="px-4 py-2"
            >
              Ativos
            </Button>
            <Button 
              variant={filtroAtivo === false ? "default" : "outline"}
              onClick={() => setFiltroAtivo(false)}
              className="px-4 py-2"
            >
              Inativos
            </Button>
            <Button 
              variant={filtroAtivo === undefined ? "default" : "outline"}
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
            <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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

        {/* Tabela Principal */}
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody style={{ background: 'white' }}>
              {alunos.map((aluno: Aluno) => {
                return (
                  <tr key={aluno.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td className="px-6 py-4">
                      {aluno.nome}
                    </td>
                    <td className="px-6 py-4">
                      {aluno.matricula}
                    </td>
                    <td className="px-6 py-4">
                      {aluno.email}
                    </td>
                    <td className="px-6 py-4">
                      {aluno.tipo}
                    </td>
                    <td className="px-6 py-4">
                      {aluno.turma}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        aluno.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {aluno.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center" style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setAlunoEmEdicao(aluno)}
                        style={{ 
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}