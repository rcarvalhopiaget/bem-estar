'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { alunoService } from '@/services/alunoService';
import { refeicaoService } from '@/services/refeicaoService';
import { Aluno } from '@/types/aluno';
import { RelatorioFiltro, NotificacaoConfig, ConfiguracaoRelatorio, TipoNotificacao } from '@/types/relatorio';
import { Refeicao, TipoRefeicao, TIPOS_REFEICAO } from '@/types/refeicao';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import { IconButton } from '@mui/material';

// Funções auxiliares para formatação de data
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const formatarDataPtBr = {
  diaSemana: (data: Date) => DIAS_SEMANA[data.getDay()],
  diaEMes: (data: Date) => `${data.getDate()} de ${MESES[data.getMonth()]}`,
  dataCompleta: (data: Date) => format(data, "dd/MM/yyyy HH:mm:ss"),
  dataSimples: (data: Date) => format(data, "dd/MM/yyyy"),
  dataArquivo: (data: Date) => format(data, "dd-MM-yyyy"),
  dataISO: (data: Date) => format(data, "yyyy-MM-dd")
};

const ICONES_REFEICAO: Record<TipoRefeicao, any> = {
  'LANCHE_MANHA': CoffeeIcon,
  'ALMOCO': RestaurantIcon,
  'LANCHE_TARDE': CakeIcon
};

const CORES_REFEICAO: Record<TipoRefeicao, string> = {
  'LANCHE_MANHA': '#ff9800',
  'ALMOCO': '#4caf50',
  'LANCHE_TARDE': '#2196f3'
};

export default function RelatoriosPage() {
  const { canWrite } = usePermissions();
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [nomeBusca, setNomeBusca] = useState<string>('');
  const [turma, setTurma] = useState<string>('');
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao | ''>('');
  const [dataInicio, setDataInicio] = useState<Date>(() => startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date>(() => endOfMonth(new Date()));
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [relatorioDiario, setRelatorioDiario] = useState(true);
  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([]);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarListaAlunos, setMostrarListaAlunos] = useState(false);
  const [configuracaoRelatorio, setConfiguracaoRelatorio] = useState<ConfiguracaoRelatorio>({
    email: '',
    horario: '18:00',
    turmas: [],
    ativo: true
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [alunosData, turmasData] = await Promise.all([
          alunoService.listarAlunos(),
          alunoService.listarTurmas()
        ]);
        setAlunos(alunosData);
        setTurmas(turmasData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        adicionarNotificacao({
          tipo: 'erro',
          mensagem: 'Erro ao carregar dados. Tente novamente.'
        });
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    if (nomeBusca.length >= 3) {
      const alunosFiltrados = alunos
        .filter(aluno => 
          aluno.nome.toLowerCase().includes(nomeBusca.toLowerCase()) ||
          aluno.turma.toLowerCase().includes(nomeBusca.toLowerCase())
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));
      setAlunosFiltrados(alunosFiltrados);
      setMostrarListaAlunos(true);
    } else {
      setAlunosFiltrados([]);
      setMostrarListaAlunos(false);
    }
  }, [nomeBusca, alunos]);

  const adicionarNotificacao = (notificacao: NotificacaoConfig) => {
    setNotificacoes(prev => [...prev, notificacao]);
  };

  const formatarData = (data: Date) => {
    const diaSemana = formatarDataPtBr.diaSemana(data);
    const diaEMes = formatarDataPtBr.diaEMes(data);
    return `${diaSemana} ${diaEMes}`;
  };

  const buscarRefeicoes = async () => {
    try {
      setLoading(true);
      setNotificacoes([]);

      const filtro: RelatorioFiltro = {
        dataInicio: startOfDay(dataInicio),
        dataFim: endOfDay(dataFim),
        alunoId: alunoSelecionado || undefined,
        turma: turma || undefined,
        tipo: tipoRefeicao || undefined
      };
      
      console.log('Buscando refeições com filtro:', {
        ...filtro,
        dataInicio: format(filtro.dataInicio!, "dd/MM/yyyy HH:mm:ss"),
        dataFim: format(filtro.dataFim!, "dd/MM/yyyy HH:mm:ss")
      });
      
      const refeicoesData = await refeicaoService.listarRefeicoes(filtro);
      
      // Remove duplicatas baseado no ID do aluno, data e tipo de refeição
      const refeicoesUnicas = Array.from(
        new Map(
          refeicoesData.map(r => [
            `${r.alunoId}-${formatarDataPtBr.dataISO(r.data)}-${r.tipo}`,
            {
              ...r,
              data: new Date(r.data)
            }
          ])
        ).values()
      );

      setRefeicoes(refeicoesUnicas);

      if (refeicoesUnicas.length === 0) {
        adicionarNotificacao({
          tipo: 'aviso',
          mensagem: 'Nenhuma refeição encontrada para os filtros selecionados.'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
      adicionarNotificacao({
        tipo: 'erro',
        mensagem: 'Erro ao buscar refeições. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    const linhas = ['Data,Nome,Turma,Tipo,Presente'];
    
    refeicoes.forEach(refeicao => {
      linhas.push(`${formatarDataPtBr.dataSimples(refeicao.data)},${refeicao.nomeAluno},${refeicao.turma},${TIPOS_REFEICAO[refeicao.tipo]},${refeicao.presente ? 'Sim' : 'Não'}`);
    });

    const csv = linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-refeicoes-${formatarDataPtBr.dataArquivo(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const RelatorioPorTurma = () => {
    const agruparPorData = (refeicoes: Refeicao[]) => {
      const grupos = new Map<string, Refeicao[]>();
      refeicoes.forEach(refeicao => {
        const dataKey = formatarDataPtBr.dataISO(refeicao.data);
        if (!grupos.has(dataKey)) {
          grupos.set(dataKey, []);
        }
        grupos.get(dataKey)!.push(refeicao);
      });
      return grupos;
    };

    const refeicoesAgrupadas = agruparPorData(refeicoes);
    const datasOrdenadas = Array.from(refeicoesAgrupadas.keys()).sort().reverse();

    return (
      <div className="space-y-6">
        {datasOrdenadas.map(dataKey => {
          const refeicoesData = refeicoesAgrupadas.get(dataKey)!;
          const data = new Date(dataKey);
          
          return (
            <div key={dataKey} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                {formatarData(data)}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-lg font-semibold">Nome</th>
                      <th className="px-4 py-3 text-left text-lg font-semibold">Turma</th>
                      <th className="px-4 py-3 text-left text-lg font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-left text-lg font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refeicoesData.map((refeicao) => {
                      const Icon = ICONES_REFEICAO[refeicao.tipo];
                      return (
                        <tr key={`${refeicao.alunoId}-${refeicao.tipo}`} 
                          className={`border-t ${refeicao.presente ? 'bg-green-50' : 'bg-red-50'}`}
                        >
                          <td className="px-4 py-3 text-lg">{refeicao.nomeAluno}</td>
                          <td className="px-4 py-3 text-lg">{refeicao.turma}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <IconButton 
                                size="medium"
                                sx={{ 
                                  color: CORES_REFEICAO[refeicao.tipo],
                                  backgroundColor: 'transparent'
                                }}
                              >
                                <Icon fontSize="large" />
                              </IconButton>
                              <span className="text-lg">{TIPOS_REFEICAO[refeicao.tipo]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium
                              ${refeicao.presente 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {refeicao.presente ? 'Comeu' : 'Não comeu'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selecionarAluno = (aluno: Aluno) => {
    setAlunoSelecionado(aluno.id);
    setNomeBusca(aluno.nome);
    setTurma(aluno.turma);
    setMostrarListaAlunos(false);
    setRefeicoes([]);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Relatório de Refeições</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2">Data Inicial</label>
          <input
            type="date"
            value={formatarDataPtBr.dataISO(dataInicio)}
            onChange={(e) => {
              setDataInicio(new Date(e.target.value));
              setRefeicoes([]);
            }}
            className="px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2">Data Final</label>
          <input
            type="date"
            value={formatarDataPtBr.dataISO(dataFim)}
            onChange={(e) => {
              setDataFim(new Date(e.target.value));
              setRefeicoes([]);
            }}
            className="px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col relative">
          <label className="text-lg font-medium mb-2">Buscar Aluno</label>
          <input
            type="text"
            value={nomeBusca}
            onChange={(e) => setNomeBusca(e.target.value)}
            placeholder="Digite o nome do aluno"
            className="px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {mostrarListaAlunos && alunosFiltrados.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto top-full">
              {alunosFiltrados.map((aluno) => (
                <button
                  key={aluno.id}
                  onClick={() => selecionarAluno(aluno)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="text-lg">{aluno.nome}</div>
                  <div className="text-sm text-gray-600">{aluno.turma}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2">Turma</label>
          <select
            value={turma}
            onChange={(e) => {
              setTurma(e.target.value);
              setAlunoSelecionado('');
              setNomeBusca('');
              setRefeicoes([]);
            }}
            className="px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2">Tipo de Refeição</label>
          <select
            value={tipoRefeicao}
            onChange={(e) => {
              setTipoRefeicao(e.target.value as TipoRefeicao);
              setRefeicoes([]);
            }}
            className="px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TIPOS_REFEICAO).map(([tipo, nome]) => (
              <option key={tipo} value={tipo}>{nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          onClick={buscarRefeicoes}
          disabled={loading}
          className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>

        {refeicoes.length > 0 && (
          <>
            <Button
              onClick={exportarCSV}
              className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Exportar CSV
            </Button>

            <Button
              onClick={() => setMostrarNotificacoes(true)}
              className="px-6 py-3 text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              Configurar Notificações
            </Button>
          </>
        )}

        <Button
          onClick={() => {
            setRelatorioDiario(!relatorioDiario);
            setRefeicoes([]);
          }}
          className="px-6 py-3 text-lg bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
        >
          {relatorioDiario ? 'Ver Relatório Mensal' : 'Ver Relatório Diário'}
        </Button>
      </div>

      {notificacoes.length > 0 && (
        <div className="mb-6">
          {notificacoes.map((notificacao, index) => (
            <div
              key={index}
              className={`p-4 mb-2 rounded-lg text-lg ${
                notificacao.tipo === 'erro'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {notificacao.mensagem}
            </div>
          ))}
        </div>
      )}

      {refeicoes.length > 0 ? (
        <RelatorioPorTurma />
      ) : !loading && (
        <div className="text-center text-lg text-gray-500">
          Selecione os filtros e clique em Buscar para ver o relatório
        </div>
      )}

      <Dialog open={mostrarNotificacoes} onOpenChange={setMostrarNotificacoes}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">
              Configurar Notificações
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium mb-2">Email para Notificações</Label>
              <Input
                type="email"
                value={configuracaoRelatorio.email}
                onChange={(e) => setConfiguracaoRelatorio(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                className="px-4 py-3 text-lg"
                placeholder="exemplo@email.com"
              />
            </div>

            <div>
              <Label className="text-lg font-medium mb-2">Horário do Relatório</Label>
              <Input
                type="time"
                value={configuracaoRelatorio.horario}
                onChange={(e) => setConfiguracaoRelatorio(prev => ({
                  ...prev,
                  horario: e.target.value
                }))}
                className="px-4 py-3 text-lg"
              />
            </div>

            <div>
              <Label className="text-lg font-medium mb-2">Turmas (opcional)</Label>
              <select
                multiple
                value={configuracaoRelatorio.turmas || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setConfiguracaoRelatorio(prev => ({
                    ...prev,
                    turmas: selectedOptions
                  }));
                }}
                className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {turmas.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Segure Ctrl para selecionar múltiplas turmas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={configuracaoRelatorio.ativo}
                onChange={(e) => setConfiguracaoRelatorio(prev => ({
                  ...prev,
                  ativo: e.target.checked
                }))}
                className="w-5 h-5"
              />
              <Label className="text-lg font-medium">Ativar notificações</Label>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => setMostrarNotificacoes(false)}
                className="px-6 py-3 text-lg bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implementar salvamento das configurações
                  setMostrarNotificacoes(false);
                  adicionarNotificacao({
                    tipo: 'aviso',
                    mensagem: 'Configurações de notificação salvas com sucesso!'
                  });
                }}
                className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}