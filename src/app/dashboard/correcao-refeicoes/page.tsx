'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { refeicaoService } from '@/services/refeicaoService';
import { Refeicao, TIPOS_REFEICAO, TipoRefeicao, RefeicaoFilter } from '@/types/refeicao';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import { CorrecaoRefeicaoModal } from '@/components/refeicoes/CorrecaoRefeicaoModal';
import { useLogService } from '@/services/logService';
import { Edit2, AlertTriangle, Filter, CalendarIcon, ShieldAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CorrecaoRefeicoesPaginaAdmin() {
  const { isAdmin, canWrite } = usePermissions();
  const { toast } = useToast();
  const { logAction } = useLogService();
  const router = useRouter();
  
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refeicaoParaCorrigir, setRefeicaoParaCorrigir] = useState<Refeicao | null>(null);
  const [isCorrecaoModalOpen, setIsCorrecaoModalOpen] = useState(false);

  // Filtros - Inicializando com a data atual formatada corretamente
  const dataAtual = new Date();
  const dataAtualFormatada = format(dataAtual, 'yyyy-MM-dd');
  
  const [dataInicio, setDataInicio] = useState(dataAtualFormatada);
  const [dataFim, setDataFim] = useState(dataAtualFormatada);
  const [tipoFiltro, setTipoFiltro] = useState<string>('all');
  const [nomeAluno, setNomeAluno] = useState<string>('');
  const [filtrando, setFiltrando] = useState(false);

  // Verificar permissões no carregamento da página
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Esta página é restrita a administradores.",
        variant: "destructive"
      });
      
      // Redirecionar para o dashboard após um pequeno atraso
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
      return;
    }

    // Registrar acesso no log
    logAction('VIEW', 'SISTEMA', 'Acesso à página de correção de refeições');
    
    carregarRefeicoes();
  }, [isAdmin, router]);

  const carregarRefeicoes = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setFiltrando(true);
      
      console.log('Iniciando filtro de refeições com:', { dataInicio, dataFim, tipoFiltro });
      
      let tipoParaFiltro: TipoRefeicao | undefined = undefined;
      if (tipoFiltro && tipoFiltro !== 'all') {
        if (Object.keys(TIPOS_REFEICAO).includes(tipoFiltro)) {
          tipoParaFiltro = tipoFiltro as TipoRefeicao;
        }
      }
      
      // MODIFICADO: Usando a data de 30 dias atrás como padrão para encontrar mais registros
      const hoje = new Date();
      const umMesAtras = new Date();
      umMesAtras.setDate(umMesAtras.getDate() - 30); // 30 dias atrás
      
      // Ajuste nas datas para garantir que a pesquisa cubra todo o dia
      const dataInicioObj = dataInicio ? new Date(dataInicio) : umMesAtras;
      const dataFimObj = dataFim ? new Date(dataFim) : hoje;
      
      // Se temos uma data de início, definimos a hora para 00:00:00
      dataInicioObj.setHours(0, 0, 0, 0);
      
      // Se temos uma data de fim, definimos a hora para 23:59:59
      dataFimObj.setHours(23, 59, 59, 999);
      
      // DIAGNÓSTICO: Tente primeiro sem o filtro de tipo
      const filtros: RefeicaoFilter = {
        dataInicio: dataInicioObj,
        dataFim: dataFimObj,
        // Temporariamente comentado para diagnóstico
        // tipo: tipoParaFiltro,
      };
      
      console.log('Enviando filtros para o backend:', JSON.stringify(filtros, (k, v) => 
        v instanceof Date ? v.toISOString() : v
      ));
      
      try {
        console.log("Iniciando chamada ao serviço de refeições...");
        let refeicoesData = await refeicaoService.listarRefeicoes(filtros);
        console.log("Serviço de refeições respondeu");
        
        console.log(`Refeições retornadas pelo backend: ${refeicoesData.length}`);
        if (refeicoesData.length > 0) {
          console.log("Primeira refeição:", JSON.stringify(refeicoesData[0], (k, v) => 
            v instanceof Date ? v.toISOString() : v
          ));
        } else {
          console.log("Nenhuma refeição encontrada no backend");
        }
        
        // DIAGNÓSTICO: Se temos refeições e o filtro de tipo foi especificado,
        // aplicamos o filtro no cliente para diagnóstico
        if (tipoParaFiltro && refeicoesData.length > 0) {
          const antesDoFiltro = refeicoesData.length;
          refeicoesData = refeicoesData.filter(r => r.tipo === tipoParaFiltro);
          console.log(`Após filtro de tipo ${tipoParaFiltro}: ${refeicoesData.length} (antes: ${antesDoFiltro})`);
        }
        
        // Filtrar por nome do aluno se fornecido
        if (nomeAluno && nomeAluno.trim() !== '') {
          const termoBusca = nomeAluno.toLowerCase().trim();
          const antesDoFiltro = refeicoesData.length;
          refeicoesData = refeicoesData.filter(refeicao => 
            refeicao.nomeAluno.toLowerCase().includes(termoBusca)
          );
          console.log(`Após filtro por nome "${termoBusca}": ${refeicoesData.length} (antes: ${antesDoFiltro})`);
        }
        
        // Ordenar por data (mais recente primeiro)
        refeicoesData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        
        // MAIS DETALHES sobre as refeições encontradas
        if (refeicoesData.length > 0) {
          const datasEncontradas = refeicoesData.map(r => format(new Date(r.data), 'dd/MM/yyyy'));
          const datasUnicas = [...new Set(datasEncontradas)];
          console.log("Datas de refeições encontradas:", datasUnicas);
        }
        
        setRefeicoes(refeicoesData);
        
        if (refeicoesData.length === 0) {
          toast({
            title: "Nenhuma refeição encontrada",
            description: `Nenhuma refeição encontrada para o período de ${format(dataInicioObj, 'dd/MM/yyyy')} a ${format(dataFimObj, 'dd/MM/yyyy')}`,
          });
        } else {
          toast({
            title: "Refeições carregadas",
            description: `Foram encontradas ${refeicoesData.length} refeições no período selecionado.`,
          });
        }
      } catch (err) {
        console.error('Erro específico na listagem:', err);
        toast({
          title: "Erro na consulta",
          description: err instanceof Error ? err.message : "Erro desconhecido na consulta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar refeições para correção:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de refeições. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setFiltrando(false);
    }
  };

  const handleOpenCorrecaoModal = (refeicao: Refeicao) => {
    // Verificar permissão novamente antes de abrir o modal
    if (!isAdmin) {
      toast({
        title: "Permissão Negada",
        description: "Apenas administradores podem corrigir refeições.",
        variant: "destructive"
      });
      return;
    }
    
    setRefeicaoParaCorrigir(refeicao);
    setIsCorrecaoModalOpen(true);
  };

  const handleSaveCorrecao = async (refeicaoCorrigida: Refeicao) => {
    // Verificação estrita de permissão de administrador
    if (!isAdmin) {
      toast({
        title: "Permissão Negada",
        description: "Apenas administradores podem corrigir refeições.",
        variant: "destructive"
      });
      throw new Error("Apenas administradores podem corrigir refeições.");
    }

    try {
      const { id, data, tipo, tipoConsumo, presente, observacao } = refeicaoCorrigida;
      
      // Adicionar informações sobre quem fez a correção
      const notaCorrecao = observacao 
        ? `${observacao} [CORRIGIDO POR ADMIN]` 
        : '[CORRIGIDO POR ADMIN]';
      
      await refeicaoService.atualizarRefeicao(id, {
        data,
        tipo,
        tipoConsumo,
        presente,
        observacao: notaCorrecao
      });
      
      // Registrar a ação no log do sistema
      await logAction(
        'UPDATE', 
        'REFEICOES', 
        `Refeição de ${refeicaoCorrigida.nomeAluno} corrigida por administrador`, 
        { 
          refeicaoId: id, 
          alunoId: refeicaoCorrigida.alunoId,
          alteracoes: {
            data: format(new Date(data), 'dd/MM/yyyy'),
            tipo,
            tipoConsumo,
            presente
          } 
        }
      );
      
      carregarRefeicoes();
      toast({
        title: "Sucesso",
        description: "Refeição corrigida com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao corrigir refeição:', error);
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar correção",
        variant: "destructive"
      });
      
      throw error;
    }
  };

  // Função para verificar diretamente o serviço de refeições
  const verificarServicoRefeicoes = async () => {
    try {
      setLoading(true);
      toast({
        title: "Verificando serviço",
        description: "Testando conexão com o serviço de refeições...",
      });
      
      // Buscar refeições dos últimos 30 dias
      const hoje = new Date();
      const umMesAtras = new Date();
      umMesAtras.setDate(umMesAtras.getDate() - 30);
      
      // Tenta buscar refeições sem filtro de tipo
      const filtroTest: RefeicaoFilter = {
        dataInicio: umMesAtras,
        dataFim: hoje
      };
      
      console.log("TEST: Enviando filtro básico:", JSON.stringify(filtroTest, (k, v) => 
        v instanceof Date ? v.toISOString() : v
      ));
      
      const refeicoesTest = await refeicaoService.listarRefeicoes(filtroTest);
      
      if (refeicoesTest.length > 0) {
        // Contagem por tipo
        const contagemPorTipo: Record<string, number> = {};
        refeicoesTest.forEach(refeicao => {
          const tipo = refeicao.tipo || 'DESCONHECIDO';
          contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
        });
        
        // Contagem por data
        const contagemPorData: Record<string, number> = {};
        refeicoesTest.forEach(refeicao => {
          const dataStr = format(new Date(refeicao.data), 'dd/MM/yyyy');
          contagemPorData[dataStr] = (contagemPorData[dataStr] || 0) + 1;
        });
        
        // Datas ordenadas (mais recentes primeiro)
        const datasOrdenadas = Object.keys(contagemPorData).sort((a, b) => {
          const [diaA, mesA, anoA] = a.split('/').map(Number);
          const [diaB, mesB, anoB] = b.split('/').map(Number);
          const dateA = new Date(anoA, mesA - 1, diaA);
          const dateB = new Date(anoB, mesB - 1, diaB);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Primeiras 5 datas mais recentes
        const datasRecentes = datasOrdenadas.slice(0, 5);
        
        console.log('Teste de serviço - detalhes:', {
          total: refeicoesTest.length,
          porTipo: contagemPorTipo,
          datasRecentes: datasRecentes.map(d => `${d}: ${contagemPorData[d]}`)
        });
        
        toast({
          title: "Teste concluído",
          description: `Encontradas ${refeicoesTest.length} refeições nos últimos 30 dias. Datas recentes: ${datasRecentes.join(', ')}`,
        });
      } else {
        console.log('Teste de serviço: Nenhuma refeição encontrada');
        toast({
          title: "Teste concluído",
          description: "Nenhuma refeição encontrada nos últimos 30 dias.",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar serviço de refeições:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao conectar com o serviço de refeições.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-lg">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Esta página é exclusiva para administradores do sistema.
            Você será redirecionado para o dashboard em instantes.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard')}
        >
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Correção de Refeições</h1>
        <Button 
          variant="outline" 
          onClick={verificarServicoRefeicoes}
          disabled={loading}
        >
          Verificar Serviço
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Esta página permite aos administradores corrigirem informações de refeições registradas incorretamente. 
          Todas as alterações serão registradas no histórico do sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar refeições específicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipoRefeicao">Tipo de Refeição</Label>
              <Select 
                value={tipoFiltro} 
                onValueChange={(value: string) => setTipoFiltro(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(TIPOS_REFEICAO).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeAluno">Nome do Aluno</Label>
              <Input
                id="nomeAluno"
                placeholder="Digite para filtrar"
                value={nomeAluno}
                onChange={(e) => setNomeAluno(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            className="mt-4 w-full" 
            onClick={carregarRefeicoes}
            disabled={loading || filtrando}
          >
            {filtrando ? "Filtrando..." : "Filtrar Refeições"}
            <Filter className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Refeições Encontradas</CardTitle>
          <CardDescription>
            {refeicoes.length} refeições encontradas. Clique no botão de edição para corrigir uma refeição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando refeições...</div>
          ) : refeicoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma refeição encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Presente</TableHead>
                    <TableHead>Tipo Consumo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refeicoes.map((refeicao) => (
                    <TableRow key={refeicao.id}>
                      <TableCell>
                        {format(new Date(refeicao.data), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{refeicao.nomeAluno}</TableCell>
                      <TableCell>{refeicao.turma}</TableCell>
                      <TableCell>{TIPOS_REFEICAO[refeicao.tipo]}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${refeicao.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {refeicao.presente ? 'Sim' : 'Não'}
                        </span>
                      </TableCell>
                      <TableCell>{refeicao.tipoConsumo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenCorrecaoModal(refeicao)}
                          title="Corrigir refeição"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CorrecaoRefeicaoModal
        refeicao={refeicaoParaCorrigir}
        isOpen={isCorrecaoModalOpen}
        onClose={() => {
          setIsCorrecaoModalOpen(false);
          setRefeicaoParaCorrigir(null);
        }}
        onSave={handleSaveCorrecao}
      />
    </div>
  );
} 