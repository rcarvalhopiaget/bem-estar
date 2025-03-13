'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { alunoService } from '@/services/alunoService';
import { refeicaoService } from '@/services/refeicaoService';
import { Aluno } from '@/types/aluno';
import { RelatorioFiltro, NotificacaoConfig } from '@/types/relatorio';
import { Refeicao, TIPOS_REFEICAO } from '@/types/refeicao';

export default function RelatoriosPage() {
  const { canWrite } = usePermissions();
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date>(endOfMonth(new Date()));
  const [turma, setTurma] = useState<string>('');
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  // Carregar alunos ao montar o componente
  useEffect(() => {
    carregarAlunos();
    carregarNotificacoes();
  }, []);

  // Limpar dados ao mudar de tela
  useEffect(() => {
    setRefeicoes([]);
    setDataInicio(startOfMonth(new Date()));
    setDataFim(endOfMonth(new Date()));
    setTurma('');
    setAlunoSelecionado('');
  }, [mostrarHistorico, mostrarNotificacoes]);

  const carregarAlunos = async () => {
    try {
      const alunosData = await alunoService.listarAlunos({ ativo: true });
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const buscarRefeicoes = async () => {
    setLoading(true);
    try {
      const filtro: RelatorioFiltro = {
        dataInicio,
        dataFim,
        alunoId: alunoSelecionado || undefined,
        turma: turma || undefined
      };
      
      const refeicoesData = await refeicaoService.listarRefeicoes(filtro);
      
      // Remover duplicatas usando um Map com chave composta
      const refeicoesUnicas = Array.from(
        new Map(
          refeicoesData.map(r => [
            `${r.alunoId}-${format(r.data, 'yyyy-MM-dd')}-${r.tipo}`,
            {
              ...r,
              data: new Date(format(r.data, 'yyyy-MM-dd')) // Normaliza a data removendo o tempo
            }
          ])
        ).values()
      );

      // Ordenar por data, nome e tipo
      const refeicoesOrdenadas = refeicoesUnicas.sort((a, b) => {
        const porData = b.data.getTime() - a.data.getTime();
        if (porData !== 0) return porData;
        
        const porNome = a.nomeAluno.localeCompare(b.nomeAluno);
        if (porNome !== 0) return porNome;
        
        return a.tipo.localeCompare(b.tipo);
      });

      setRefeicoes(refeicoesOrdenadas);
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    const linhas = ['Data,Nome,Turma,Tipo,Presente'];
    
    refeicoes.forEach(refeicao => {
      linhas.push(`${format(refeicao.data, 'dd/MM/yyyy')},${refeicao.nomeAluno},${refeicao.turma},${TIPOS_REFEICAO[refeicao.tipo]},${refeicao.presente ? 'Sim' : 'Não'}`);
    });

    const csv = linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-refeicoes-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const carregarNotificacoes = async () => {
    // TODO: Implementar serviço de notificações
    setNotificacoes([
      {
        email: 'coordenador@escola.com',
        tipo: 'DIARIO',
        horario: '18:00',
        turmas: ['1A', '1B'],
        ativo: true
      }
    ]);
  };

  const salvarNotificacao = async (notificacao: NotificacaoConfig) => {
    // TODO: Implementar serviço de notificações
    setNotificacoes(prev => [...prev, notificacao]);
  };

  const HistoricoAluno = () => {
    // Busca o nome do aluno selecionado
    const alunoNome = alunos.find(a => a.id === alunoSelecionado)?.nome;

    return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Histórico Detalhado por Aluno</h2>
          {alunoNome && <p className="text-gray-600 mt-1">Aluno: {alunoNome}</p>}
        </div>
        <Button 
          onClick={() => {
            setMostrarHistorico(false);
            setRefeicoes([]);
            setAlunoSelecionado('');
          }}
        >
          Voltar
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={alunoSelecionado}
            onChange={(e) => {
              setAlunoSelecionado(e.target.value);
              setRefeicoes([]);
            }}
            className="p-2 border rounded"
          >
            <option value="">Selecione um aluno</option>
            {alunos
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map(aluno => (
                <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
              ))
            }
          </select>

          <input
            type="date"
            value={format(dataInicio, 'yyyy-MM-dd')}
            onChange={(e) => {
              setDataInicio(new Date(e.target.value));
              setRefeicoes([]);
            }}
            className="p-2 border rounded"
          />

          <input
            type="date"
            value={format(dataFim, 'yyyy-MM-dd')}
            onChange={(e) => {
              setDataFim(new Date(e.target.value));
              setRefeicoes([]);
            }}
            className="p-2 border rounded"
          />
        </div>

        <Button 
          onClick={buscarRefeicoes} 
          disabled={loading || !alunoSelecionado}
          className={!alunoSelecionado ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>

        {refeicoes.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Presente</th>
                  </tr>
                </thead>
                <tbody>
                  {refeicoes.map((refeicao) => (
                    <tr key={`${refeicao.alunoId}-${format(refeicao.data, 'yyyy-MM-dd')}-${refeicao.tipo}`} className="border-t">
                      <td className="px-4 py-2">{format(refeicao.data, "dd/MM/yyyy")}</td>
                      <td className="px-4 py-2">{TIPOS_REFEICAO[refeicao.tipo]}</td>
                      <td className="px-4 py-2">{refeicao.presente ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={exportarCSV} className="mt-4">
              Exportar CSV
            </Button>
          </>
        )}

        {refeicoes.length === 0 && !loading && alunoSelecionado && (
          <div className="text-center text-gray-600 mt-4">
            Nenhuma refeição encontrada no período selecionado.
          </div>
        )}
      </div>
    </div>
  )};

  const NotificacoesConfig = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Configurar Notificações</h2>
        <Button onClick={() => setMostrarNotificacoes(false)}>Voltar</Button>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">Notificações Ativas</h3>
        <div className="grid gap-4">
          {notificacoes.map((notificacao, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{notificacao.email}</p>
                  <p className="text-sm text-gray-600">
                    {notificacao.tipo} - {notificacao.horario}
                    {notificacao.turmas && ` - Turmas: ${notificacao.turmas.join(', ')}`}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const novasNotificacoes = [...notificacoes];
                    novasNotificacoes[index].ativo = !novasNotificacoes[index].ativo;
                    setNotificacoes(novasNotificacoes);
                  }}
                  className={notificacao.ativo ? 'bg-red-500' : 'bg-green-500'}
                >
                  {notificacao.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Adicionar Nova Notificação</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              salvarNotificacao({
                email: formData.get('email') as string,
                tipo: formData.get('tipo') as 'DIARIO' | 'SEMANAL' | 'MENSAL',
                horario: formData.get('horario') as string,
                turmas: formData.get('turmas') ? (formData.get('turmas') as string).split(',') : undefined,
                ativo: true
              });
            }}
            className="space-y-4"
          >
            <input
              type="email"
              name="email"
              placeholder="Email do coordenador"
              required
              className="w-full p-2 border rounded"
            />
            <select name="tipo" required className="w-full p-2 border rounded">
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal</option>
            </select>
            <input
              type="time"
              name="horario"
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              name="turmas"
              placeholder="Turmas (opcional, separadas por vírgula)"
              className="w-full p-2 border rounded"
            />
            <Button type="submit">Adicionar Notificação</Button>
          </form>
        </div>
      </div>
    </div>
  );

  if (mostrarHistorico) {
    return <HistoricoAluno />;
  }

  if (mostrarNotificacoes) {
    return <NotificacoesConfig />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Histórico por Aluno */}
        <div 
          onClick={() => setMostrarHistorico(true)}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold mb-2">Histórico por Aluno</h2>
          <p className="text-gray-600">Visualize o histórico detalhado de refeições por aluno.</p>
          <div className="mt-4 text-primary hover:text-primary/80">
            Ver histórico →
          </div>
        </div>

        {/* Card de Relatórios Personalizados */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Relatórios Personalizados</h2>
          <div className="space-y-4">
            <select
              value={turma}
              onChange={(e) => {
                setTurma(e.target.value);
                setRefeicoes([]);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Todas as turmas</option>
              {Array.from(new Set(alunos.map(a => a.turma))).sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={format(dataInicio, 'yyyy-MM-dd')}
                onChange={(e) => {
                  setDataInicio(new Date(e.target.value));
                  setRefeicoes([]);
                }}
                className="p-2 border rounded"
              />
              <input
                type="date"
                value={format(dataFim, 'yyyy-MM-dd')}
                onChange={(e) => {
                  setDataFim(new Date(e.target.value));
                  setRefeicoes([]);
                }}
                className="p-2 border rounded"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={buscarRefeicoes} disabled={loading} className="flex-1">
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
              {refeicoes.length > 0 && (
                <Button onClick={exportarCSV} className="bg-green-600 hover:bg-green-700">
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Card de Notificações */}
        <div 
          onClick={() => setMostrarNotificacoes(true)}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold mb-2">Notificações</h2>
          <p className="text-gray-600">Configure notificações automáticas para coordenadores.</p>
          <div className="mt-4 text-primary hover:text-primary/80">
            Configurar →
          </div>
        </div>
      </div>

      {refeicoes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">Resultado da Busca</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Turma</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Presente</th>
                </tr>
              </thead>
              <tbody>
                {refeicoes.map((refeicao) => (
                  <tr key={`${refeicao.alunoId}-${format(refeicao.data, 'yyyy-MM-dd')}-${refeicao.tipo}`} className="border-t">
                    <td className="px-4 py-2">{format(refeicao.data, "dd/MM/yyyy")}</td>
                    <td className="px-4 py-2">{refeicao.nomeAluno}</td>
                    <td className="px-4 py-2">{refeicao.turma}</td>
                    <td className="px-4 py-2">{TIPOS_REFEICAO[refeicao.tipo]}</td>
                    <td className="px-4 py-2">{refeicao.presente ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}