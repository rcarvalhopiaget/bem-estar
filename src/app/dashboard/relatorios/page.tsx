'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/usePermissions';
import { alunoService } from '@/services/alunoService';
import { refeicaoService } from '@/services/refeicaoService';
import { 
  obterConfiguracaoEnvioRelatorio, 
  salvarConfiguracaoEnvioRelatorio,
  enviarRelatorioEmail,
  enviarEmailTeste
} from '@/services/emailService';
import { Aluno } from '@/types/aluno';
import { Refeicao, TipoRefeicao } from '@/types/refeicao';
import { IconButton } from '@mui/material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import { toast } from '@/components/ui/toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface NotificacaoConfig {
  tipo: 'erro' | 'aviso';
  mensagem: string;
}

interface ConfiguracaoRelatorio {
  emails: string[];
  horario: string;
  ativo: boolean;
}

interface RelatorioFiltro {
  dataInicio: Date;
  dataFim: Date;
  turma?: string;
  alunoId?: string;
  tipo?: TipoRefeicao;
}

const TIPOS_REFEICAO: Record<TipoRefeicao, string> = {
  'LANCHE_MANHA': 'Lanche da Manhã',
  'ALMOCO': 'Almoço',
  'LANCHE_TARDE': 'Lanche da Tarde',
  'SOPA': 'Sopa'
};

const ICONES_REFEICAO: Record<TipoRefeicao, React.ElementType> = {
  'LANCHE_MANHA': CoffeeIcon,
  'ALMOCO': RestaurantIcon,
  'LANCHE_TARDE': CakeIcon,
  'SOPA': RestaurantIcon // Usando o mesmo ícone do almoço para a sopa
};

const CORES_REFEICAO: Record<TipoRefeicao, string> = {
  'LANCHE_MANHA': '#ff9800',
  'ALMOCO': '#4caf50',
  'LANCHE_TARDE': '#9c27b0',
  'SOPA': '#2196f3'
};

const formatarData = {
  diaSemana: (data: Date) => format(data, 'EEEE'),
  diaEMes: (data: Date) => format(data, "d 'de' MMMM"),
  dataCompleta: (data: Date) => format(data, "dd/MM/yyyy HH:mm:ss"),
  dataSimples: (data: Date) => format(data, "dd/MM/yyyy"),
  dataArquivo: (data: Date) => format(data, "dd-MM-yyyy"),
  dataISO: (data: Date) => format(data, "yyyy-MM-dd")
};

export default function RelatoriosPage() {
  const { hasPermission } = usePermissions();
  const [filtro, setFiltro] = useState<RelatorioFiltro>({
    dataInicio: startOfMonth(new Date()),
    dataFim: endOfMonth(new Date()),
  });
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [turma, setTurma] = useState<string>('');
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao | ''>('');
  const [nomeBusca, setNomeBusca] = useState<string>('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [alunosFiltrados, setAlunosFiltrados] = useState<Aluno[]>([]);
  const [mostrarListaAlunos, setMostrarListaAlunos] = useState<boolean>(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [enviandoEmailTeste, setEnviandoEmailTeste] = useState(false);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [configuracaoRelatorio, setConfiguracaoRelatorio] = useState<ConfiguracaoRelatorio>({
    emails: [''],
    horario: '18:00',
    ativo: false
  });
  const [novoEmail, setNovoEmail] = useState<string>('');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const alunosData = await alunoService.listarAlunos();
        setAlunos(alunosData);

        // Extrair turmas únicas
        const turmasUnicas = Array.from(new Set(alunosData.map(aluno => aluno.turma)))
          .filter(Boolean)
          .sort();
        setTurmas(turmasUnicas);

        // Carregar configuração de relatório
        const config = await obterConfiguracaoEnvioRelatorio();
        setConfiguracaoRelatorio(config);
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

  const buscarRefeicoes = async () => {
    try {
      setCarregando(true);
      setNotificacoes([]);

      const filtroConsulta: RelatorioFiltro = {
        dataInicio: startOfDay(filtro.dataInicio),
        dataFim: endOfDay(filtro.dataFim),
        alunoId: alunoSelecionado || undefined,
        turma: turma || undefined,
        tipo: tipoRefeicao || undefined
      };
      
      console.log('Buscando refeições com filtro:', {
        ...filtroConsulta,
        dataInicio: formatarData.dataCompleta(filtroConsulta.dataInicio!),
        dataFim: formatarData.dataCompleta(filtroConsulta.dataFim!)
      });
      
      const refeicoesData = await refeicaoService.listarRefeicoes(filtroConsulta);
      
      // Remove duplicatas baseado no ID do aluno, data e tipo de refeição
      const refeicoesUnicas = Array.from(
        new Map(
          refeicoesData.map(r => [
            `${r.alunoId}-${formatarData.dataISO(r.data)}-${r.tipo}`,
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
      setCarregando(false);
    }
  };

  const exportarCSV = () => {
    const linhas = ['Data e Hora,Nome,Turma,Tipo,Presente'];
    
    refeicoes.forEach(refeicao => {
      linhas.push(`${formatarData.dataCompleta(refeicao.data)},${refeicao.nomeAluno},${refeicao.turma},${TIPOS_REFEICAO[refeicao.tipo]},${refeicao.presente ? 'Sim' : 'Não'}`);
    });

    const csv = linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-refeicoes-${formatarData.dataArquivo(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const agruparRefeicoesPorTurma = () => {
    const grupos: Record<string, Refeicao[]> = {};
    refeicoes.forEach(refeicao => {
      const turma = refeicao.turma || 'Sem Turma';
      if (!grupos[turma]) {
        grupos[turma] = [];
      }
      grupos[turma].push(refeicao);
    });
    return grupos;
  };

  const RelatorioPorTurma = () => {
    const refeicoesAgrupadas = agruparRefeicoesPorTurma();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      setIsMobile(window.innerWidth < 640);
      
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <div className="space-y-6">
        {Object.entries(refeicoesAgrupadas).map(([turma, refeicoesData]) => {
          const totalAlunos = refeicoesData.length;
          const totalPresentes = refeicoesData.filter((r: Refeicao) => r.presente).length;
          const percentualPresenca = ((totalPresentes / totalAlunos) * 100).toFixed(1);

          return (
            <div key={turma} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">{turma}</h3>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                    <span>Total: {totalAlunos}</span>
                    <span>•</span>
                    <span>Presentes: {totalPresentes}</span>
                    <span>•</span>
                    <span>Presença: {percentualPresenca}%</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-base sm:text-lg font-semibold">Nome</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-base sm:text-lg font-semibold">Turma</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-base sm:text-lg font-semibold">Tipo</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-base sm:text-lg font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refeicoesData.map((refeicao: Refeicao) => {
                      const Icon = ICONES_REFEICAO[refeicao.tipo];
                      const tipoNome = TIPOS_REFEICAO[refeicao.tipo];
                      const corRefeicao = CORES_REFEICAO[refeicao.tipo];

                      if (!Icon) {
                        console.error(`Ícone não encontrado para o tipo: ${refeicao.tipo}`);
                        return null;
                      }

                      return (
                        <tr key={`${refeicao.alunoId}-${refeicao.tipo}`} 
                          className={`border-t ${refeicao.presente ? 'bg-green-50' : 'bg-red-50'}`}
                        >
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg">{refeicao.nomeAluno}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg">{refeicao.turma}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2">
                              <IconButton 
                                size={isMobile ? "small" : "medium"}
                                sx={{ 
                                  color: corRefeicao,
                                  backgroundColor: 'transparent'
                                }}
                              >
                                <Icon fontSize={isMobile ? "small" : "medium"} />
                              </IconButton>
                              <span className="text-base sm:text-lg">{tipoNome}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-base sm:text-lg font-medium
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

  const salvarConfigEmail = async () => {
    try {
      setEnviandoEmail(true);
      await salvarConfiguracaoEnvioRelatorio(
        configuracaoRelatorio.emails,
        configuracaoRelatorio.horario,
        configuracaoRelatorio.ativo
      );
      setMostrarNotificacoes(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const enviarRelatorioPorEmail = async () => {
    if (!configuracaoRelatorio.emails.length) {
      toast.error('Configure pelo menos um email para receber notificações primeiro');
      return;
    }

    if (refeicoes.length === 0) {
      toast.error('Não há dados para enviar no relatório');
      return;
    }

    try {
      setEnviandoEmail(true);
      
      // Gerar CSV para anexo
      const linhas = ['Data e Hora,Nome,Turma,Tipo,Presente'];
      refeicoes.forEach(refeicao => {
        linhas.push(`${formatarData.dataCompleta(refeicao.data)},${refeicao.nomeAluno},${refeicao.turma},${TIPOS_REFEICAO[refeicao.tipo]},${refeicao.presente ? 'Sim' : 'Não'}`);
      });
      const csv = linhas.join('\n');
      
      // Gerar conteúdo HTML
      const htmlContent = `
        <h1>Relatório de Refeições</h1>
        <p>Período: ${formatarData.dataSimples(filtro.dataInicio)} a ${formatarData.dataSimples(filtro.dataFim)}</p>
        ${turma ? `<p>Turma: ${turma}</p>` : ''}
        ${tipoRefeicao ? `<p>Tipo de Refeição: ${TIPOS_REFEICAO[tipoRefeicao as TipoRefeicao]}</p>` : ''}
        <p>Total de registros: ${refeicoes.length}</p>
        <p>Este relatório foi gerado automaticamente pelo sistema Bem-Estar.</p>
      `;
      
      // Enviar email para todos os destinatários configurados
      for (const email of configuracaoRelatorio.emails) {
        if (email.trim()) {
          await enviarRelatorioEmail(
            email,
            `Relatório de Refeições - ${formatarData.dataSimples(filtro.dataInicio)} a ${formatarData.dataSimples(filtro.dataFim)}`,
            htmlContent,
            csv
          );
        }
      }
      
      toast.success(`Relatório enviado para ${configuracaoRelatorio.emails.length} destinatário(s)`);
      
    } catch (error) {
      console.error('Erro ao enviar relatório por email:', error);
      toast.error('Erro ao enviar relatório por email');
    } finally {
      setEnviandoEmail(false);
    }
  };

  // Função para enviar email de teste
  const enviarTesteEmail = async () => {
    try {
      setEnviandoEmailTeste(true);
      
      if (!configuracaoRelatorio.emails.length) {
        toast.error('Configure pelo menos um email para receber notificações primeiro');
        return;
      }
      
      // Enviar email de teste em 1 minuto
      const resultado = await enviarEmailTeste(1);
      
      if (resultado.success) {
        toast.success(`Email de teste agendado para ${resultado.horarioEnvio}. Verifique sua caixa de entrada em breve.`);
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste');
    } finally {
      setEnviandoEmailTeste(false);
    }
  };

  // Adicionar um novo email à lista
  const adicionarEmail = () => {
    if (novoEmail.trim() && !configuracaoRelatorio.emails.includes(novoEmail.trim())) {
      setConfiguracaoRelatorio(prev => ({
        ...prev,
        emails: [...prev.emails, novoEmail.trim()]
      }));
      setNovoEmail('');
    }
  };

  // Remover um email da lista
  const removerEmail = (index: number) => {
    setConfiguracaoRelatorio(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  return (
    <ProtectedRoute allowedProfiles={['ADMIN', 'COORDENADOR', 'PROFESSOR']}>
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Relatório de Refeições</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col">
            <label className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Data Inicial</label>
            <input
              type="date"
              value={formatarData.dataISO(filtro.dataInicio)}
              onChange={(e) => {
                setFiltro(prev => ({ ...prev, dataInicio: new Date(e.target.value) }));
                setRefeicoes([]);
              }}
              className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Data Final</label>
            <input
              type="date"
              value={formatarData.dataISO(filtro.dataFim)}
              onChange={(e) => {
                setFiltro(prev => ({ ...prev, dataFim: new Date(e.target.value) }));
                setRefeicoes([]);
              }}
              className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col relative">
            <label className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Buscar Aluno</label>
            <input
              type="text"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              placeholder="Digite o nome do aluno"
              className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {mostrarListaAlunos && alunosFiltrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto top-full">
                {alunosFiltrados.map((aluno) => (
                  <button
                    key={aluno.id}
                    onClick={() => selecionarAluno(aluno)}
                    className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="text-base sm:text-lg">{aluno.nome}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{aluno.turma}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Turma</label>
            <select
              value={turma}
              onChange={(e) => {
                setTurma(e.target.value);
                setAlunoSelecionado('');
                setNomeBusca('');
                setRefeicoes([]);
              }}
              className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Tipo de Refeição</label>
            <select
              value={tipoRefeicao}
              onChange={(e) => {
                setTipoRefeicao(e.target.value as TipoRefeicao);
                setRefeicoes([]);
              }}
              className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(TIPOS_REFEICAO).map(([tipo, nome]) => (
                <option key={tipo} value={tipo}>{nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            onClick={buscarRefeicoes}
            disabled={carregando}
            className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {carregando ? 'Buscando...' : 'Buscar'}
          </Button>

          <Button
            onClick={() => setMostrarNotificacoes(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Configurar Notificações
          </Button>

          {refeicoes.length > 0 && (
            <>
              <Button
                onClick={exportarCSV}
                className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Exportar CSV
              </Button>
              
              {configuracaoRelatorio.emails.length > 0 && (
                <Button
                  onClick={enviarRelatorioPorEmail}
                  disabled={enviandoEmail}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {enviandoEmail ? 'Enviando...' : 'Enviar por Email'}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Feedback das configurações de notificações */}
        {configuracaoRelatorio.emails.length > 0 ? (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Configurações de Notificações</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">Emails:</span> {configuracaoRelatorio.emails.join(', ')}
              </div>
              <div>
                <span className="font-medium">Horário de envio:</span> {configuracaoRelatorio.horario}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                {configuracaoRelatorio.ativo ? (
                  <span className="text-green-600 font-medium">Ativo</span>
                ) : (
                  <span className="text-red-600 font-medium">Inativo</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Configurações de Notificações</h3>
            <p className="text-gray-700">
              Nenhuma configuração de email definida. Clique em "Configurar Notificações" para definir emails para receber relatórios.
            </p>
          </div>
        )}

        {notificacoes.length > 0 && (
          <div className="mb-4 sm:mb-6">
            {notificacoes.map((notificacao, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 mb-2 rounded-lg text-base sm:text-lg font-medium
                  ${notificacao.tipo === 'erro'
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
        ) : (
          <div className="text-center py-8">
            <p className="text-base sm:text-lg text-gray-600">
              Selecione os filtros e clique em Buscar para ver o relatório
            </p>
          </div>
        )}

        <Dialog
          open={mostrarNotificacoes}
          onOpenChange={setMostrarNotificacoes}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Notificações</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-base sm:text-lg font-medium mb-2 block">
                  Emails para receber relatórios
                </Label>
                <div className="space-y-2">
                  {configuracaoRelatorio.emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const novaLista = [...configuracaoRelatorio.emails];
                          novaLista[index] = e.target.value;
                          setConfiguracaoRelatorio(prev => ({
                            ...prev,
                            emails: novaLista
                          }));
                        }}
                        className="flex-1 text-base sm:text-lg"
                      />
                      <Button
                        onClick={() => removerEmail(index)}
                        type="button"
                        variant="destructive"
                        className="px-2 py-1"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="Adicionar novo email"
                    className="flex-1 text-base sm:text-lg"
                  />
                  <Button
                    onClick={adicionarEmail}
                    type="button"
                    variant="outline"
                    className="px-3 py-2"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="horario" className="text-base sm:text-lg font-medium">
                  Horário do envio
                </Label>
                <Input
                  id="horario"
                  type="time"
                  value={configuracaoRelatorio.horario}
                  onChange={(e) => setConfiguracaoRelatorio(prev => ({
                    ...prev,
                    horario: e.target.value
                  }))}
                  className="mt-1 text-base sm:text-lg"
                />
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="ativo"
                  checked={configuracaoRelatorio.ativo}
                  onCheckedChange={(checked) => setConfiguracaoRelatorio(prev => ({
                    ...prev,
                    ativo: checked
                  }))}
                />
                <Label htmlFor="ativo" className="text-base sm:text-lg font-medium">
                  Enviar relatório diariamente
                </Label>
              </div>
              <div className="flex justify-end gap-2 sm:gap-4 mt-4">
                <Button
                  onClick={() => setMostrarNotificacoes(false)}
                  className="px-3 sm:px-4 py-2 text-base sm:text-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarConfigEmail}
                  disabled={enviandoEmail}
                  className="px-3 sm:px-4 py-2 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {enviandoEmail ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  onClick={enviarTesteEmail}
                  disabled={enviandoEmailTeste}
                  className="px-3 sm:px-4 py-2 text-base sm:text-lg bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {enviandoEmailTeste ? 'Enviando...' : 'Enviar Email de Teste'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}