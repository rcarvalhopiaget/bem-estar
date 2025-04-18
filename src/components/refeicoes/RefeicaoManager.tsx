'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefeicaoForm } from '@/components/refeicoes/RefeicaoForm';
import { refeicaoService } from '@/services/refeicaoService';
import { alunoService } from '@/services/alunoService';
import { Refeicao, TIPOS_REFEICAO } from '@/types/refeicao';
import { Aluno } from '@/types/aluno';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionAlert } from '@/components/ui/permission-alert';
import { isFirebasePermissionError } from '@/lib/errors';
import { useLogService } from '@/services/logService';
import { useToast } from '@/components/ui/use-toast';

export function RefeicaoManager() {
  const { isAuthenticated, isAdmin, isOperador, isProfessor } = usePermissions();
  // Definir permissão de escrita com base no perfil do usuário
  const podeEscrever = isAuthenticated && (isAdmin || isOperador || isProfessor);
  
  const [showForm, setShowForm] = useState(false);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [dataFiltro, setDataFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<Refeicao['tipo'] | ''>('');
  const [turmaFiltro, setTurmaFiltro] = useState('');

  const { logAction } = useLogService();
  const { toast } = useToast();

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (dataFiltro) {
      carregarRefeicoes();
    }
  }, [dataFiltro, tipoFiltro, turmaFiltro]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await carregarAlunos();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setLoading(false);
    }
  };

  const carregarAlunos = async () => {
    try {
      const alunosData = await alunoService.listarAlunos({ ativo: true });
      setAlunos(alunosData);
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setError('Erro ao carregar alunos. Por favor, verifique sua conexão e tente novamente.');
      setAlunos([]);
    }
  };

  const carregarRefeicoes = async () => {
    try {
      setLoading(true);
      const dataFiltroDate = dataFiltro ? new Date(dataFiltro) : undefined;
      
      const filtros = {
        data: dataFiltroDate,
        tipo: tipoFiltro || undefined,
        turma: turmaFiltro || undefined
      };
      
      const refeicoesData = await refeicaoService.listarRefeicoes(filtros);
      setRefeicoes(refeicoesData);
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar refeições:', error);
      let mensagem = 'Erro ao carregar refeições. Por favor, tente novamente.';
      
      if (isFirebasePermissionError(error)) {
        mensagem = 'Você não tem permissão para acessar as refeições. Verifique suas credenciais.';
      }
      
      setError(mensagem);
      setRefeicoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!podeEscrever) {
      setError('Você não tem permissão para registrar refeições.');
      toast({ title: 'Erro de Permissão', description: 'Você não tem permissão para registrar refeições.', variant: 'destructive' });
      return;
    }

    try {
      setError(null);
      const refeicaoId = await refeicaoService.registrarRefeicao({
        ...data,
        data: new Date(data.data)
      });
      setShowForm(false);
      toast({ title: 'Sucesso', description: `Refeição registrada para ${data.nomeAluno}.` });
      await logAction('CREATE', 'REFEICOES', `Refeição (${data.tipo}) registrada para ${data.nomeAluno}`, { refeicaoId, alunoId: data.alunoId });
      carregarRefeicoes();
    } catch (error: any) {
      console.error('Erro ao registrar refeição:', error);
      let mensagem = 'Erro ao registrar refeição. Por favor, tente novamente.';
      if (isFirebasePermissionError(error)) {
        mensagem = 'Você não tem permissão para registrar refeições.';
      }
      setError(mensagem);
      toast({ title: 'Erro', description: mensagem, variant: 'destructive' });
      await logAction('ERROR', 'REFEICOES', `Falha ao registrar refeição para ${data.nomeAluno}`, { error: error?.message, dados: data });
    }
  };

  const handleTogglePresenca = async (refeicao: Refeicao) => {
    if (!podeEscrever) {
      setError('Você não tem permissão para atualizar refeições.');
      toast({ title: 'Erro de Permissão', description: 'Você não tem permissão para atualizar refeições.', variant: 'destructive' });
      return;
    }
    const novaPresenca = !refeicao.presente;

    try {
      await refeicaoService.atualizarRefeicao(refeicao.id, {
        presente: novaPresenca
      });
      toast({ title: 'Sucesso', description: `Presença atualizada para ${refeicao.nomeAluno}.` });
      await logAction('UPDATE', 'REFEICOES', `Presença da refeição (${refeicao.tipo}) de ${refeicao.nomeAluno} alterada para ${novaPresenca ? 'Presente' : 'Ausente'}`, { refeicaoId: refeicao.id, alunoId: refeicao.alunoId });
      carregarRefeicoes();
    } catch (error: any) {
      console.error('Erro ao atualizar presença:', error);
      let mensagem = 'Erro ao atualizar presença. Por favor, tente novamente.';
      if (isFirebasePermissionError(error)) {
        mensagem = 'Você não tem permissão para atualizar refeições.';
      }
      setError(mensagem);
      toast({ title: 'Erro', description: mensagem, variant: 'destructive' });
      await logAction('ERROR', 'REFEICOES', `Falha ao atualizar presença para ${refeicao.nomeAluno} (ID: ${refeicao.id})`, { error: error?.message });
    }
  };

  // Obter turmas únicas dos alunos
  const turmasUnicas = Array.from(new Set(alunos.map(aluno => aluno.turma))).sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Refeições</h1>
        <div className="space-x-4">
          <Button 
            onClick={() => setShowForm(true)}
            disabled={!podeEscrever}
            title={!podeEscrever ? 'Você não tem permissão para criar novas refeições' : ''}
          >
            Nova Refeição
          </Button>
        </div>
      </div>

      {error && <PermissionAlert error={error} />}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
            <Button 
              onClick={() => setDataFiltro(format(new Date(), 'yyyy-MM-dd'))}
              variant="outline"
              className="mt-1 whitespace-nowrap"
            >
              Hoje
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Refeição
          </label>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as Refeicao['tipo'])}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(TIPOS_REFEICAO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turma
          </label>
          <select
            value={turmaFiltro}
            onChange={(e) => setTurmaFiltro(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Todas</option>
            {turmasUnicas.map((turma) => (
              <option key={turma} value={turma}>
                {turma}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Refeições */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center">Carregando...</div>
        ) : !dataFiltro ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">Selecione uma data para visualizar as refeições</p>
            <p className="text-sm">Os cards aparecerão desmarcados para o registro de hoje</p>
          </div>
        ) : refeicoes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhuma refeição encontrada
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {refeicoes.map((refeicao) => (
              <li key={refeicao.id} className={`px-4 py-4 transition-colors duration-200 ${refeicao.presente ? 'bg-primary/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {refeicao.nomeAluno}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {refeicao.turma} - {refeicao.tipo}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleTogglePresenca(refeicao)}
                    disabled={!podeEscrever}
                    variant={refeicao.presente ? 'default' : 'outline'}
                    title={!podeEscrever ? 'Você não tem permissão para atualizar presenças' : ''}
                  >
                    {refeicao.presente ? 'Presente' : 'Ausente'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <RefeicaoForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          alunos={alunos}
        />
      )}
    </div>
  );
}
