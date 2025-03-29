'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/usePermissions';
import { alunoService } from '@/services/alunoService';
import { refeicaoService } from '@/services/refeicaoService';
import {
  getConfiguracaoRelatorio,
  salvarConfiguracaoRelatorio,
  enviarEmailTesteAction,
  ConfiguracaoRelatorio
} from '@/actions/configRelatorioActions';
import { Aluno } from '@/types/aluno';
import { Refeicao, TipoRefeicao } from '@/types/refeicao';
import { IconButton } from '@mui/material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import { toast } from '@/components/ui/use-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, X, Plus, Trash2, Send, Settings, MailWarning } from 'lucide-react';

interface NotificacaoConfig {
  tipo: 'erro' | 'aviso' | 'sucesso';
  mensagem: string;
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
  'SOPA': RestaurantIcon
};

const CORES_REFEICAO: Record<TipoRefeicao, string> = {
  'LANCHE_MANHA': '#ff9800',
  'ALMOCO': '#4caf50',
  'LANCHE_TARDE': '#9c27b0',
  'SOPA': '#2196f3'
};

const formatarData = {
  diaSemana: (data: Date) => format(data, 'EEEE', { locale: ptBR }),
  diaEMes: (data: Date) => format(data, "d 'de' MMMM", { locale: ptBR }),
  dataCompleta: (data: Date) => format(data, "dd/MM/yyyy HH:mm:ss"),
  dataSimples: (data: Date) => format(data, "dd/MM/yyyy"),
  dataArquivo: (data: Date) => format(data, "dd-MM-yyyy"),
  dataISO: (data: Date) => format(data, "yyyy-MM-dd")
};

export default function RelatoriosPage() {
  const { hasPermission, podeGerenciarConfiguracoes } = usePermissions();
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
  const [enviandoEmailTeste, setEnviandoEmailTeste] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(false);
  const [mostrarDialogoConfig, setMostrarDialogoConfig] = useState(false);
  const [mostrarDialogoTeste, setMostrarDialogoTeste] = useState(false);
  const [emailParaTeste, setEmailParaTeste] = useState('');
  const [errosConfig, setErrosConfig] = useState<Record<string, string[] | undefined>>({});
  const [configuracaoRelatorio, setConfiguracaoRelatorio] = useState<ConfiguracaoRelatorio>({
    emails: [],
    horario: '18:00',
    ativo: false
  });
  const [novoEmail, setNovoEmail] = useState<string>('');

  const adicionarNotificacao = useCallback((notificacao: NotificacaoConfig) => {
    toast({
      title: notificacao.tipo.charAt(0).toUpperCase() + notificacao.tipo.slice(1),
      description: notificacao.mensagem,
      variant: notificacao.tipo === 'erro' ? 'destructive' : 'default',
    });
    setNotificacoes(prev => [...prev, notificacao]);
  }, []);

  const carregarAlunosETurmas = useCallback(async () => {
    try {
      const alunosData = await alunoService.listarAlunos();
      setAlunos(alunosData);
      const turmasUnicas = Array.from(new Set(alunosData.map(aluno => aluno.turma)))
        .filter(Boolean)
        .sort();
      setTurmas(turmasUnicas);
    } catch (error) {
      console.error('Erro ao carregar alunos e turmas:', error);
      adicionarNotificacao({
        tipo: 'erro',
        mensagem: 'Erro ao carregar lista de alunos. Tente novamente.',
      });
    }
  }, [adicionarNotificacao]);

  const carregarConfiguracaoEmail = useCallback(async () => {
    if (!podeGerenciarConfiguracoes) return;

    setCarregandoConfig(true);
    try {
      const resultado = await getConfiguracaoRelatorio();
      if (resultado.success && resultado.data) {
        setConfiguracaoRelatorio(resultado.data);
      } else {
        console.error('Erro ao carregar configuração de email:', resultado.error);
        adicionarNotificacao({
          tipo: 'erro',
          mensagem: resultado.error || 'Falha ao carregar configuração de envio de relatórios.',
        });
        setConfiguracaoRelatorio({ emails: [], horario: '18:00', ativo: false });
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar configuração de email:', error);
      adicionarNotificacao({
        tipo: 'erro',
        mensagem: 'Erro inesperado ao buscar configurações. Tente novamente.',
      });
      setConfiguracaoRelatorio({ emails: [], horario: '18:00', ativo: false });
    } finally {
      setCarregandoConfig(false);
    }
  }, [adicionarNotificacao, podeGerenciarConfiguracoes]);

  useEffect(() => {
    carregarAlunosETurmas();
    carregarConfiguracaoEmail();
  }, [carregarAlunosETurmas, carregarConfiguracaoEmail]);

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
      
      const refeicoesUnicas = Array.from(
        new Map(
          refeicoesData.map(r => [
            `${r.alunoId}-${formatarData.dataISO(new Date(r.data))}-${r.tipo}`,
            {
              ...r,
              data: new Date(r.data)
            }
          ])
        ).values()
      ).sort((a, b) => b.data.getTime() - a.data.getTime());

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
    if (refeicoes.length === 0) {
      adicionarNotificacao({ tipo: 'aviso', mensagem: 'Nenhuma refeição para exportar.' });
      return;
    }
    const linhas = ['Data e Hora,Nome,Turma,Tipo,Presente'];
    
    refeicoes.forEach(refeicao => {
      const dataFormatada = formatarData.dataCompleta(new Date(refeicao.data));
      linhas.push(`${dataFormatada},${refeicao.nomeAluno},${refeicao.turma},${TIPOS_REFEICAO[refeicao.tipo]},${refeicao.presente ? 'Sim' : 'Não'}`);
    });

    const csv = linhas.join('\n');
    const blob = new Blob(["\ufeff", csv], { type: 'text/csv;charset=utf-8;' });
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
    return Object.keys(grupos).sort().reduce((obj, key) => {
      obj[key] = grupos[key].sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno));
      return obj;
    }, {} as Record<string, Refeicao[]>);
  };

  const RelatorioPorTurma = () => {
    const refeicoesAgrupadas = agruparRefeicoesPorTurma();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (refeicoes.length === 0) {
      return <p className="text-center text-gray-500 mt-4">Nenhum dado para exibir.</p>;
    }

    return (
      <div className="space-y-6 mt-6">
        {Object.entries(refeicoesAgrupadas).map(([turma, refeicoesDaTurma]) => (
          <div key={turma} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-primary">{turma}</h3>
            {isMobile ? (
              <div className="space-y-3">
                {refeicoesDaTurma.map((refeicao, index) => {
                   const Icone = ICONES_REFEICAO[refeicao.tipo];
                   const cor = CORES_REFEICAO[refeicao.tipo];
                   return (
                     <div key={`${refeicao.id}-${index}`} className="border rounded p-3 bg-card">
                       <p><strong>Aluno:</strong> {refeicao.nomeAluno}</p>
                       <p><strong>Data:</strong> {formatarData.dataSimples(new Date(refeicao.data))}</p>
                       <p className="flex items-center">
                         <strong>Tipo:</strong>
                         <Icone style={{ color: cor, marginLeft: '8px', marginRight: '4px' }} fontSize="small" />
                         {TIPOS_REFEICAO[refeicao.tipo]}
                       </p>
                       <p><strong>Presente:</strong> {refeicao.presente ? 'Sim' : 'Não'}</p>
                     </div>
                   );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                       <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presente</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {refeicoesDaTurma.map((refeicao, index) => {
                          const Icone = ICONES_REFEICAO[refeicao.tipo];
                          const cor = CORES_REFEICAO[refeicao.tipo];
                          return (
                             <tr key={`${refeicao.id}-${index}`}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{refeicao.nomeAluno}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatarData.dataSimples(new Date(refeicao.data))}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                   <Icone style={{ color: cor, marginRight: '8px' }} fontSize="small" />
                                   {TIPOS_REFEICAO[refeicao.tipo]}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{refeicao.presente ? 'Sim' : 'Não'}</td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const selecionarAluno = (aluno: Aluno) => {
    setNomeBusca(aluno.nome);
    setAlunoSelecionado(aluno.id);
    setMostrarListaAlunos(false);
  };

  const salvarConfigEmail = async () => {
    if (!podeGerenciarConfiguracoes) {
       adicionarNotificacao({ tipo: 'erro', mensagem: 'Permissão negada para salvar configurações.' });
       return;
    }
    setSalvandoConfig(true);
    setErrosConfig({});
    try {
      const resultado = await salvarConfiguracaoRelatorio(configuracaoRelatorio);
      if (resultado.success) {
        adicionarNotificacao({ tipo: 'sucesso', mensagem: 'Configuração salva com sucesso!' });
        setMostrarDialogoConfig(false);
      } else {
        adicionarNotificacao({ tipo: 'erro', mensagem: resultado.error || 'Falha ao salvar configuração.' });
        if (resultado.fieldErrors) {
           setErrosConfig(resultado.fieldErrors);
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao salvar configuração:', error);
      adicionarNotificacao({ tipo: 'erro', mensagem: 'Erro inesperado ao salvar. Tente novamente.' });
    } finally {
      setSalvandoConfig(false);
    }
  };

  const enviarTesteEmail = async () => {
    if (!podeGerenciarConfiguracoes) {
       adicionarNotificacao({ tipo: 'erro', mensagem: 'Permissão negada para enviar email de teste.' });
       return;
    }
    if (!emailParaTeste || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParaTeste)) {
       adicionarNotificacao({ tipo: 'erro', mensagem: 'Por favor, insira um email válido para o teste.' });
       return;
    }
    setEnviandoEmailTeste(true);
    try {
      const resultado = await enviarEmailTesteAction(emailParaTeste);
      if (resultado.success) {
        adicionarNotificacao({
          tipo: 'sucesso',
          mensagem: `Email de teste enviado com sucesso para ${emailParaTeste}! ${resultado.previewUrl ? '(Verifique o console para URL de preview)' : ''}`
        });
      } else {
        adicionarNotificacao({ tipo: 'erro', mensagem: resultado.message || 'Falha ao enviar email de teste.' });
      }
    } catch (error) {
      console.error('Erro inesperado ao enviar email de teste:', error);
      adicionarNotificacao({ tipo: 'erro', mensagem: 'Erro inesperado ao enviar teste. Tente novamente.' });
    } finally {
      setEnviandoEmailTeste(false);
    }
  };

  const adicionarEmail = () => {
    if (novoEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
      if (!configuracaoRelatorio.emails.includes(novoEmail)) {
         setConfiguracaoRelatorio(prev => ({
           ...prev,
           emails: [...prev.emails, novoEmail]
         }));
         setNovoEmail('');
         setErrosConfig(prev => ({ ...prev, emails: undefined }));
      } else {
         adicionarNotificacao({ tipo: 'aviso', mensagem: 'Este email já foi adicionado.' });
      }
    } else {
      adicionarNotificacao({ tipo: 'erro', mensagem: 'Por favor, insira um email válido.' });
    }
  };

  const removerEmail = (index: number) => {
    setConfiguracaoRelatorio(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
    setErrosConfig(prev => ({ ...prev, emails: undefined }));
  };

  const handleConfigChange = (field: keyof ConfiguracaoRelatorio, value: any) => {
    setConfiguracaoRelatorio(prev => ({ ...prev, [field]: value }));
    if (field === 'horario' || field === 'ativo') {
       setErrosConfig(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Relatórios de Refeições</h1>
           {podeGerenciarConfiguracoes && (
              <Button onClick={() => setMostrarDialogoConfig(true)} variant="outline">
                 <Settings className="mr-2 h-4 w-4" />
                 Configurar Envio Automático
              </Button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={formatarData.dataISO(filtro.dataInicio)}
              onChange={(e) => setFiltro({ ...filtro, dataInicio: new Date(e.target.value + 'T00:00:00') })}
            />
          </div>
          <div>
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={formatarData.dataISO(filtro.dataFim)}
              onChange={(e) => setFiltro({ ...filtro, dataFim: new Date(e.target.value + 'T00:00:00') })}
            />
          </div>
          <div>
            <Label htmlFor="turma">Turma</Label>
            <select
              id="turma"
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              className="w-full mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="">Todas as Turmas</option>
              {turmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="tipoRefeicao">Tipo Refeição</Label>
            <select
              id="tipoRefeicao"
              value={tipoRefeicao}
              onChange={(e) => setTipoRefeicao(e.target.value as TipoRefeicao | '')}
              className="w-full mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="">Todos os Tipos</option>
              {(Object.keys(TIPOS_REFEICAO) as TipoRefeicao[]).map(tipo => (
                <option key={tipo} value={tipo}>{TIPOS_REFEICAO[tipo]}</option>
              ))}
            </select>
          </div>
          <div className="relative md:col-span-2 lg:col-span-4">
             <Label htmlFor="buscaAluno">Buscar Aluno (Nome ou Turma)</Label>
             <Input
               id="buscaAluno"
               type="text"
               placeholder="Digite nome ou turma (mín. 3 caracteres)"
               value={nomeBusca}
               onChange={(e) => {
                  setNomeBusca(e.target.value);
                  setAlunoSelecionado('');
               }}
             />
             {mostrarListaAlunos && (
               <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-auto rounded-md shadow-lg">
                 {alunosFiltrados.length > 0 ? (
                   alunosFiltrados.map(aluno => (
                     <li
                       key={aluno.id}
                       className="p-2 hover:bg-gray-100 cursor-pointer"
                       onClick={() => selecionarAluno(aluno)}
                     >
                       {aluno.nome} ({aluno.turma})
                     </li>
                   ))
                 ) : (
                   <li className="p-2 text-gray-500">Nenhum aluno encontrado</li>
                 )}
               </ul>
             )}
           </div>

          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4 justify-start">
            <Button onClick={buscarRefeicoes} disabled={carregando}>
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Buscar Refeições
            </Button>
            <Button onClick={exportarCSV} variant="secondary" disabled={refeicoes.length === 0}>
              Exportar CSV
            </Button>
             {podeGerenciarConfiguracoes && (
                 <Button onClick={() => setMostrarDialogoTeste(true)} variant="secondary">
                    <MailWarning className="mr-2 h-4 w-4" />
                    Enviar Email Teste
                 </Button>
             )}
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-gray-500">Carregando...</p>
          </div>
        ) : (
          <RelatorioPorTurma />
        )}

         {podeGerenciarConfiguracoes && (
            <Dialog open={mostrarDialogoConfig} onOpenChange={setMostrarDialogoConfig}>
               <DialogContent className="sm:max-w-[600px]">
               <DialogHeader>
                  <DialogTitle>Configurar Envio Automático de Relatório</DialogTitle>
                  <DialogDescription>
                     Configure os emails que receberão o relatório diário e o horário do envio.
                  </DialogDescription>
               </DialogHeader>
               {carregandoConfig ? (
                   <div className="flex justify-center items-center p-10">
                       <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   </div>
               ) : (
                   <div className="grid gap-4 py-4">
                       <div className="space-y-2">
                          <Label>Emails Destinatários</Label>
                          {configuracaoRelatorio.emails.map((email, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <Input value={email} readOnly className="flex-1" />
                                <Button onClick={() => removerEmail(index)} variant="destructive" size="icon" disabled={salvandoConfig}>
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          ))}
                           {errosConfig?.emails && <p className="text-sm text-red-500">{errosConfig.emails[0]}</p>}
                          <div className="flex items-center gap-2">
                             <Input
                                type="email"
                                placeholder="Adicionar novo email"
                                value={novoEmail}
                                onChange={(e) => setNovoEmail(e.target.value)}
                                className="flex-1"
                                disabled={salvandoConfig}
                             />
                             <Button onClick={adicionarEmail} variant="outline" size="icon" disabled={salvandoConfig}>
                                <Plus className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="horario">Horário Envio (HH:MM)</Label>
                          <Input
                             id="horario"
                             type="time"
                             value={configuracaoRelatorio.horario}
                             onChange={(e) => handleConfigChange('horario', e.target.value)}
                             disabled={salvandoConfig}
                          />
                           {errosConfig?.horario && <p className="text-sm text-red-500">{errosConfig.horario[0]}</p>}
                       </div>

                       <div className="flex items-center space-x-2">
                          <Switch
                             id="ativo"
                             checked={configuracaoRelatorio.ativo}
                             onCheckedChange={(checked) => handleConfigChange('ativo', checked)}
                             disabled={salvandoConfig}
                          />
                          <Label htmlFor="ativo">Envio Automático Ativo</Label>
                       </div>
                        {errosConfig?.ativo && <p className="text-sm text-red-500">{errosConfig.ativo[0]}</p>}
                   </div>
               )}
               <DialogFooter>
                  <Button variant="outline" onClick={() => setMostrarDialogoConfig(false)} disabled={salvandoConfig}>
                     Cancelar
                  </Button>
                  <Button onClick={salvarConfigEmail} disabled={salvandoConfig || carregandoConfig}>
                      {salvandoConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Salvar Configuração
                  </Button>
               </DialogFooter>
               </DialogContent>
            </Dialog>
         )}

          {podeGerenciarConfiguracoes && (
              <Dialog open={mostrarDialogoTeste} onOpenChange={setMostrarDialogoTeste}>
                 <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                    <DialogTitle>Enviar Email de Teste</DialogTitle>
                    <DialogDescription>
                       Insira um email para enviar uma mensagem de teste com as configurações atuais do servidor.
                    </DialogDescription>
                 </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <Label htmlFor="emailTeste">Email Destinatário</Label>
                    <Input
                       id="emailTeste"
                       type="email"
                       placeholder="email@exemplo.com"
                       value={emailParaTeste}
                       onChange={(e) => setEmailParaTeste(e.target.value)}
                       disabled={enviandoEmailTeste}
                    />
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setMostrarDialogoTeste(false)} disabled={enviandoEmailTeste}>
                       Cancelar
                    </Button>
                    <Button onClick={enviarTesteEmail} disabled={enviandoEmailTeste}>
                       {enviandoEmailTeste ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                       Enviar Teste
                    </Button>
                 </DialogFooter>
                 </DialogContent>
              </Dialog>
           )}

      </div>
    </ProtectedRoute>
  );
}