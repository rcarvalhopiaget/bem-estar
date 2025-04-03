'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
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
import { Aluno, AlunoTipo } from '@/types/aluno';
import { Refeicao, TipoRefeicao } from '@/types/refeicao';
import { IconButton } from '@mui/material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import { useToast } from '@/components/ui/use-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, X, Plus, Trash2, Send, Settings, MailWarning, Mail } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  tipoConsumo?: AlunoTipo;
}

const TIPOS_ALUNO_LABELS: Record<AlunoTipo, string> = {
  AVULSO: 'Avulso',
  INTEGRAL_5X: 'Integral 5x',
  INTEGRAL_4X: 'Integral 4x',
  INTEGRAL_3X: 'Integral 3x',
  INTEGRAL_2X: 'Integral 2x',
  MENSALISTA: 'Mensalista',
  SEMI_INTEGRAL: 'Semi Integral',
  ESTENDIDO: 'Estendido',
};

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
  diaSemana: (data: Date) => format(data, 'EEEE'),
  diaEMes: (data: Date) => format(data, "d 'de' MMMM"),
  dataCompleta: (data: Date) => format(data, "dd/MM/yyyy HH:mm:ss"),
  dataSimples: (data: Date) => format(data, "dd/MM/yyyy"),
  dataArquivo: (data: Date) => format(data, "dd-MM-yyyy"),
  dataISO: (data: Date) => format(data, "yyyy-MM-dd")
};

export default function RelatoriosPage() {
  const { hasPermission, podeGerenciarConfiguracoes } = usePermissions();
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<RelatorioFiltro>({
    dataInicio: startOfMonth(new Date()),
    dataFim: endOfMonth(new Date()),
  });
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [turma, setTurma] = useState<string>('');
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao | ''>('');
  const [tipoConsumoSelecionado, setTipoConsumoSelecionado] = useState<AlunoTipo | ''>('');
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
  }, [toast]);

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
        tipo: tipoRefeicao || undefined,
        tipoConsumo: tipoConsumoSelecionado || undefined
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
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Relatórios de Refeições</h1>
          {podeGerenciarConfiguracoes && (
            <Button onClick={() => setMostrarDialogoConfig(true)} variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configurar Envios
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
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
              onChange={(e) => setFiltro({ ...filtro, dataFim: new Date(e.target.value + 'T23:59:59') })}
            />
          </div>
          <div>
            <Label htmlFor="turma">Turma</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger id="turma">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tipoRefeicao">Tipo de Refeição</Label>
            <Select value={tipoRefeicao} onValueChange={(value) => setTipoRefeicao(value as TipoRefeicao | '')}>
              <SelectTrigger id="tipoRefeicao">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_REFEICAO).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tipoConsumo">Tipo de Consumo</Label>
            <Select value={tipoConsumoSelecionado} onValueChange={(value) => setTipoConsumoSelecionado(value as AlunoTipo | '')}>
              <SelectTrigger id="tipoConsumo">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_ALUNO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 relative">
            <Label htmlFor="buscaAluno">Buscar Aluno por Nome/Turma</Label>
            <div className="flex items-center">
                <Input
                  id="buscaAluno"
                  type="text"
                  placeholder="Digite o nome ou turma..."
                  value={nomeBusca}
                  onChange={(e) => {
                      setNomeBusca(e.target.value);
                      if (!e.target.value) {
                          setAlunoSelecionado('');
                      }
                  }}
                />
                {alunoSelecionado && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setAlunoSelecionado('');
                        setNomeBusca('');
                    }} className="ml-1">
                        <X className="h-4 w-4"/>
                    </Button>
                )}
            </div>
            {mostrarListaAlunos && alunosFiltrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {alunosFiltrados.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => selecionarAluno(aluno)}
                  >
                    {aluno.nome} ({aluno.turma})
                  </div>
                ))}
              </div>
            )}
            {mostrarListaAlunos && alunosFiltrados.length === 0 && nomeBusca.length >= 3 && (
                 <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg px-4 py-2 text-sm text-gray-500">
                   Nenhum aluno encontrado.
                 </div>
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={buscarRefeicoes} disabled={carregando} className="w-full">
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Buscar Refeições
            </Button>
          </div>
        </div>

        {notificacoes.length > 0 && (
          <div className="space-y-2">
            {notificacoes.map((not, index) => (
              <div key={index} className={`p-3 rounded-md text-sm ${not.tipo === 'erro' ? 'bg-red-100 text-red-700' : not.tipo === 'aviso' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                <strong>{not.tipo.toUpperCase()}:</strong> {not.mensagem}
              </div>
            ))}
          </div>
        )}

        {refeicoes.length > 0 && !carregando && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
               <h2 className="text-lg font-semibold">Resultados</h2>
               <Button onClick={exportarCSV} variant="outline" size="sm">
                   Exportar CSV
               </Button>
           </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                    <th className="px-4 py-2 text-left font-medium">Data</th>
                    <th className="px-4 py-2 text-left font-medium">Aluno</th>
                    <th className="px-4 py-2 text-left font-medium">Turma</th>
                    <th className="px-4 py-2 text-left font-medium">Tipo Refeição</th>
                    <th className="px-4 py-2 text-left font-medium">Tipo Consumo</th>
                    <th className="px-4 py-2 text-left font-medium">Presente</th>
                    <th className="px-4 py-2 text-left font-medium">Observação</th>
                    </tr>
                </thead>
                <tbody>
                    {refeicoes.map((refeicao) => (
                    <tr key={refeicao.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">{formatarData.dataSimples(refeicao.data)}</td>
                        <td className="px-4 py-2">{refeicao.nomeAluno}</td>
                        <td className="px-4 py-2">{refeicao.turma}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                            <span className="flex items-center">
                                {React.createElement(ICONES_REFEICAO[refeicao.tipo] || 'span', { style: { color: CORES_REFEICAO[refeicao.tipo], marginRight: '4px' } })}
                                {TIPOS_REFEICAO[refeicao.tipo]}
                            </span>
                        </td>
                         <td className="px-4 py-2">{refeicao.tipoConsumo ? TIPOS_ALUNO_LABELS[refeicao.tipoConsumo as AlunoTipo] : '-'}</td>
                        <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${refeicao.presente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {refeicao.presente ? 'Sim' : 'Não'}
                            </span>
                        </td>
                        <td className="px-4 py-2">{refeicao.observacao || '-'}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}
        {refeicoes.length === 0 && !carregando && (
             <div className="text-center p-4 text-gray-500">
                 Nenhuma refeição encontrada para os filtros selecionados.
             </div>
        )}

        {mostrarDialogoConfig && podeGerenciarConfiguracoes && (
            <Dialog open={mostrarDialogoConfig} onOpenChange={setMostrarDialogoConfig}>
                 <DialogContent className="sm:max-w-[525px]">
                     <DialogHeader>
                         <DialogTitle>Configurar Envios Automáticos</DialogTitle>
                         <DialogDescription>
                            Configure os emails e o horário para envio automático do relatório diário de refeições.
                         </DialogDescription>
                     </DialogHeader>
                     {carregandoConfig ? (
                         <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                         </div>
                     ) : (
                         <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Emails para Envio</Label>
                                {configuracaoRelatorio.emails.map((email, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input value={email} readOnly className="flex-1" />
                                        <Button variant="outline" size="icon" onClick={() => removerEmail(index)} disabled={salvandoConfig}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {configuracaoRelatorio.emails.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Nenhum email configurado.</p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Input 
                                    type="email"
                                    placeholder="Adicionar novo email..."
                                    value={novoEmail}
                                    onChange={(e) => setNovoEmail(e.target.value)}
                                    disabled={salvandoConfig}
                                />
                                <Button onClick={adicionarEmail} disabled={!novoEmail || salvandoConfig} variant="secondary">
                                    <Plus className="h-4 w-4 mr-1"/> Adicionar
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="horario" className="text-right col-span-1">Horário</Label>
                                <Input 
                                    id="horario"
                                    type="time"
                                    value={configuracaoRelatorio.horario}
                                    onChange={(e) => handleConfigChange('horario', e.target.value)}
                                    className="col-span-3"
                                    disabled={salvandoConfig}
                                />
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
                         </div>
                     )}
                     <DialogFooter>
                        <Button 
                            variant="outline"
                            onClick={() => setMostrarDialogoTeste(true)} 
                            disabled={salvandoConfig || carregandoConfig || configuracaoRelatorio.emails.length === 0}
                        >
                             <Send className="mr-2 h-4 w-4"/>
                             Enviar Teste
                         </Button>
                         <Button 
                            onClick={salvarConfigEmail} 
                            disabled={salvandoConfig || carregandoConfig}
                         >
                             {salvandoConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                             Salvar Configurações
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
        )}

         {mostrarDialogoTeste && (
             <Dialog open={mostrarDialogoTeste} onOpenChange={setMostrarDialogoTeste}>
                 <DialogContent className="sm:max-w-md">
                     <DialogHeader>
                         <DialogTitle>Enviar Email de Teste</DialogTitle>
                         <DialogDescription>
                            Digite um email para enviar um relatório de teste com os dados de hoje.
                         </DialogDescription>
                     </DialogHeader>
                     <div className="py-4">
                        <Label htmlFor="emailTeste">Email</Label>
                        <Input 
                            id="emailTeste"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={emailParaTeste}
                            onChange={(e) => setEmailParaTeste(e.target.value)}
                            disabled={enviandoEmailTeste}
                        />
                        {errosConfig?.testEmail && (
                            <p className="text-sm text-red-500 mt-1">{errosConfig.testEmail.join(', ')}</p>
                        )}
                     </div>
                     <DialogFooter>
                         <Button variant="outline" onClick={() => setMostrarDialogoTeste(false)} disabled={enviandoEmailTeste}>Cancelar</Button>
                         <Button 
                            onClick={enviarTesteEmail}
                            disabled={enviandoEmailTeste || !emailParaTeste}
                         >
                            {enviandoEmailTeste ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                            Enviar
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
         )}
      </div>
    </ProtectedRoute>
  );
}