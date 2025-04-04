'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Box, Alert, Dialog, DialogTitle, DialogContent, Grid, IconButton, Button } from '@mui/material';
import { Aluno } from '@/types/aluno';
import { refeicaoService } from '@/services/refeicaoService';
import { TipoRefeicao, Refeicao, RefeicaoFormData } from '@/types/refeicao';
import { useToast } from "@/components/ui/use-toast";
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useLogService } from '@/services/logService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AlunoTipo } from '@/types/aluno';

interface Props {
  alunos: Aluno[];
  data: Date;
  onRefeicaoMarcada: () => void;
}

// Limites de refeições por tipo de aluno e tipo de refeição
const LIMITE_REFEICOES: Record<string, { LANCHE_MANHA: number; ALMOCO: number; LANCHE_TARDE: number; SOPA: number }> = {
  'INTEGRAL_5X': {
    LANCHE_MANHA: 5,
    ALMOCO: 5,
    LANCHE_TARDE: 5,
    SOPA: 5
  },
  'INTEGRAL_4X': {
    LANCHE_MANHA: 4,
    ALMOCO: 4,
    LANCHE_TARDE: 4,
    SOPA: 4
  },
  'INTEGRAL_3X': {
    LANCHE_MANHA: 3,
    ALMOCO: 3,
    LANCHE_TARDE: 3,
    SOPA: 3
  },
  'INTEGRAL_2X': {
    LANCHE_MANHA: 2,
    ALMOCO: 2,
    LANCHE_TARDE: 2,
    SOPA: 2
  },
  'MENSALISTA': {
    LANCHE_MANHA: 999,
    ALMOCO: 999,
    LANCHE_TARDE: 999,
    SOPA: 999
  },
  'AVULSO': {
    LANCHE_MANHA: 999,
    ALMOCO: 999,
    LANCHE_TARDE: 999,
    SOPA: 999
  }
};

// Tipos de refeição disponíveis
const TODOS_TIPOS_REFEICAO = [
  { 
    id: 'LANCHE_MANHA' as TipoRefeicao, 
    nome: 'Lanche da Manhã', 
    horario: '09:30',
    icon: CoffeeIcon,
    color: '#1976d2', // Azul
    operador: true
  },
  { 
    id: 'ALMOCO' as TipoRefeicao, 
    nome: 'Almoço', 
    horario: '12:00',
    icon: RestaurantIcon,
    color: '#2e7d32', // Verde
    operador: true
  },
  { 
    id: 'LANCHE_TARDE' as TipoRefeicao, 
    nome: 'Lanche da Tarde', 
    horario: '15:30',
    icon: CakeIcon,
    color: '#ed6c02', // Laranja
    operador: true
  },
  { 
    id: 'SOPA' as TipoRefeicao, 
    nome: 'Sopa', 
    horario: '18:00',
    icon: SoupKitchenIcon,
    color: '#d32f2f', // Vermelho
    operador: true
  }
];

export default function RefeicaoRapida({ alunos, data, onRefeicaoMarcada }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canWrite } = usePermissions();
  const { logAction } = useLogService();
  const [filtroNome, setFiltroNome] = useState('');
  const [turmaFiltro, setTurmaFiltro] = useState('');
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [alunosComeram, setAlunosComeram] = useState<Record<string, Partial<Record<TipoRefeicao, boolean>>>>({});
  const [refeicoesSemanais, setRefeicoesSemanais] = useState<Record<string, Record<TipoRefeicao, number>>>({});
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  
  // Obter turmas únicas e ordenadas
  const turmasUnicas = useMemo(() => {
    const turmas = new Set(alunos.map(a => a.turma).filter(Boolean));
    return Array.from(turmas).sort((a, b) => a.localeCompare(b));
  }, [alunos]);
  
  useEffect(() => {
    if (user?.email?.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('RefeicaoRapida: É usuário do restaurante!');
    } else {
      setIsRestauranteUser(false);
    }
  }, [user]);
  
  const TIPOS_REFEICAO = TODOS_TIPOS_REFEICAO;

  const dataFormatada = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(data), [data]);

  const isMesmoDia = (data1: Date, data2: Date): boolean => {
    return (
      data1.getFullYear() === data2.getFullYear() &&
      data1.getMonth() === data2.getMonth() &&
      data1.getDate() === data2.getDate()
    );
  };

  useEffect(() => {
    const carregarRefeicoes = async () => {
      // Resetar estados independentemente do erro/sucesso
      setAlunosComeram({});
      setRefeicoesSemanais({});
      try {
        if (!user) {
          // Não fazer nada se o usuário não estiver logado ainda
          console.warn('Usuário não autenticado, aguardando...');
          return;
        }

        // Obter token UMA VEZ
        let idToken = '';
        try {
           idToken = await user.getIdToken();
        } catch (tokenError: any) {
            console.error('Erro ao obter idToken:', tokenError);
             // Tratar erro específico de quota aqui também, se ocorrer ao obter token
            if (tokenError?.code === 'auth/quota-exceeded') {
                 toast({ title: "Quota Excedida", description: "Limite de autenticação atingido ao obter token. Tente recarregar.", variant: "destructive" });
            } else {
                 toast({ title: "Erro de Autenticação", description: "Não foi possível obter o token do usuário.", variant: "destructive" });
            }
            return; // Não continuar sem token
        }

        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(data);
        dataFim.setHours(23, 59, 59, 999);

        // Preparar chamadas passando o token
        const refeicoesSemanaisPromises = alunos.map(aluno =>
          refeicaoService.buscarRefeicoesSemana(aluno.id, data, idToken) // Passar token
        );

        // Executar chamadas em paralelo
        const [refeicoesDoDia, ...refeicoesSemanaisRaw] = await Promise.all([
           refeicaoService.listarRefeicoes({ dataInicio, dataFim, presente: true }), // Assumindo que esta não precisa de token ou já o obtém internamente de forma segura
           ...refeicoesSemanaisPromises
        ]);

        // Processar refeicoesDoDia
        const comeram: Record<string, Partial<Record<TipoRefeicao, boolean>>> = {};
        refeicoesDoDia.forEach(refeicao => {
          if (!comeram[refeicao.alunoId]) comeram[refeicao.alunoId] = {};
          if (Object.values(TODOS_TIPOS_REFEICAO).some(tr => tr.id === refeicao.tipo)) {
             comeram[refeicao.alunoId][refeicao.tipo] = true;
          }
        });
        setAlunosComeram(comeram);

        // Processar refeicoesSemanaisRaw
        const refeicoesSemanaisPorAluno: Record<string, Record<TipoRefeicao, number>> = {};
        alunos.forEach((aluno, index) => {
          const contadores: Record<TipoRefeicao, number> = { LANCHE_MANHA: 0, ALMOCO: 0, LANCHE_TARDE: 0, SOPA: 0 };
          const refeicoesDoAlunoNaSemana = refeicoesSemanaisRaw[index] || [];
          refeicoesDoAlunoNaSemana.forEach(refeicao => {
            if (refeicao.isAvulso !== true && contadores[refeicao.tipo] !== undefined) {
              contadores[refeicao.tipo]++;
            }
          });
          refeicoesSemanaisPorAluno[aluno.id] = contadores;
        });
        setRefeicoesSemanais(refeicoesSemanaisPorAluno);

      } catch (error: any) {
        // Tratar erros das chamadas de serviço
        console.error('Erro ao carregar refeições:', error);
        if (error?.code === 'auth/quota-exceeded') {
             toast({ title: "Quota Excedida", description: "Limite de autenticação atingido durante busca de dados. Tente novamente mais tarde.", variant: "destructive" });
        } else if (error instanceof Error) {
             toast({ title: "Erro", description: `Erro ao carregar dados: ${error.message}`, variant: "destructive" });
        } else {
            toast({ title: "Erro Desconhecido", description: "Ocorreu um erro inesperado ao carregar os dados.", variant: "destructive" });
        }
        // Estados já foram resetados no início do try
      }
    };

    carregarRefeicoes();
  }, [data, alunos, toast, user]); // Adicionar user às dependências

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(aluno => {
      const termoBuscaNome = filtroNome.toLowerCase();
      const matchNome = aluno.nome.toLowerCase().includes(termoBuscaNome);
      const matchTurma = !turmaFiltro || turmaFiltro === 'all' || aluno.turma === turmaFiltro;
      return matchNome && matchTurma;
    });
  }, [alunos, filtroNome, turmaFiltro]);

  const handleCardClick = (aluno: Aluno) => {
    const hoje = new Date();
    if (!isMesmoDia(data, hoje)) {
      toast({ title: "Info", description: "Só é possível registrar refeições para o dia atual." });
      return;
    }
    if (!aluno.ativo) {
      toast({ title: "Atenção", description: `Aluno ${aluno.nome} está inativo.` });
      return;
    }
    if (!canWrite) {
      toast({ title: "Permissão Negada", description: "Você não tem permissão para registrar refeições.", variant: "destructive" });
      return;
    }
    setAlunoSelecionado(aluno);
    setDialogoAberto(true);
  };

  const handleMarcarRefeicao = async (tipoRefeicao: TipoRefeicao) => {
    const alunoParaMarcar = alunoSelecionado;
    if (!alunoParaMarcar || !canWrite) return;

    const tipoAlunoOriginal = alunoParaMarcar.tipo;
    const limiteSemanalConfig = LIMITE_REFEICOES[tipoAlunoOriginal];
    const limiteTipoEspecifico = limiteSemanalConfig?.[tipoRefeicao] ?? 999;
    const refeicoesAtuaisSemana = refeicoesSemanais[alunoParaMarcar.id]?.[tipoRefeicao] ?? 0;
    const diaDaSemanaAtual = data.getDay(); // 0 = Domingo, ..., 6 = Sábado
    const diasPermitidos = alunoParaMarcar.diasRefeicaoPermitidos || [];

    // --- Calcular o Tipo Efetivo da Refeição ---
    let tipoEfetivoParaSalvar: AlunoTipo = tipoAlunoOriginal; // Assume o tipo original por padrão
    let motivoAvulso = '';

    if (tipoAlunoOriginal === 'AVULSO') {
      tipoEfetivoParaSalvar = 'AVULSO';
      motivoAvulso = 'Aluno é Avulso.';
    } else if (tipoAlunoOriginal.startsWith('INTEGRAL')) {
      // Verifica dia permitido (Seg=1 a Sex=5)
      if (diasPermitidos.length > 0 && (diaDaSemanaAtual < 1 || diaDaSemanaAtual > 5 || !diasPermitidos.includes(diaDaSemanaAtual))) {
        tipoEfetivoParaSalvar = 'AVULSO';
        motivoAvulso = 'Dia não permitido pelo plano.';
      } 
      // Verifica limite semanal (apenas se NÃO for avulso pelo dia)
      else if (refeicoesAtuaisSemana >= limiteTipoEspecifico) {
         tipoEfetivoParaSalvar = 'AVULSO';
         motivoAvulso = 'Limite semanal de refeições atingido.';
      }
    } 
    // Adicionar lógica para SEMI_INTEGRAL e ESTENDIDO se eles tiverem dias permitidos
    else if ((tipoAlunoOriginal === 'SEMI_INTEGRAL' || tipoAlunoOriginal === 'ESTENDIDO') && diasPermitidos.length > 0) {
        if (diaDaSemanaAtual < 1 || diaDaSemanaAtual > 5 || !diasPermitidos.includes(diaDaSemanaAtual)) {
            tipoEfetivoParaSalvar = 'AVULSO';
            motivoAvulso = 'Dia não permitido pelo plano.';
        }
    }
    // ----------------------------------------------

    const nomeTipoRefeicao = TIPOS_REFEICAO.find(t => t.id === tipoRefeicao)?.nome || tipoRefeicao;
    const acao = `Marcar ${tipoEfetivoParaSalvar !== tipoAlunoOriginal ? '(AVULSO)' : ''} ${nomeTipoRefeicao}`;

    // --- Confirmação para Avulso Inesperado ---
    if (tipoEfetivoParaSalvar === 'AVULSO' && tipoAlunoOriginal !== 'AVULSO') {
      if (!window.confirm(`${alunoParaMarcar.nome} (${tipoAlunoOriginal})\n${motivoAvulso}\nDeseja registrar esta refeição (${nomeTipoRefeicao}) como AVULSO?`)) {
        setDialogoAberto(false);
        setAlunoSelecionado(null);
        toast({ title: "Cancelado", description: "Registro de refeição avulsa cancelado.", variant: "default" });
        return; // Interrompe a execução se o usuário cancelar
      }
    }
    // -----------------------------------------

    let refeicaoId: string | null = null;
    let reverterContagemSemanal = false;

    try {
      setDialogoAberto(false);
      toast({ title: "Processando...", description: `${acao} para ${alunoParaMarcar.nome}` });

      const refeicaoData: Omit<RefeicaoFormData, 'id'> = { // Ajustar tipo se RefeicaoFormData mudar
        alunoId: alunoParaMarcar.id,
        nomeAluno: alunoParaMarcar.nome,
        turma: alunoParaMarcar.turma,
        data: data,
        tipo: tipoRefeicao, // Tipo da refeição (Almoço, Lanche)
        presente: true,
        tipoConsumo: tipoEfetivoParaSalvar // <<< NOVO: Passa o tipo calculado
        // Remover isAvulso se ele não existir mais em RefeicaoFormData
      };

      // Atualização otimista da contagem semanal (APENAS se não for AVULSO)
      if (tipoEfetivoParaSalvar !== 'AVULSO') {
         setRefeicoesSemanais(prev => ({
           ...prev,
           [alunoParaMarcar.id]: {
             ...prev[alunoParaMarcar.id],
             [tipoRefeicao]: (prev[alunoParaMarcar.id]?.[tipoRefeicao] ?? 0) + 1
           }
         }));
         reverterContagemSemanal = true; 
      }

      // --- Chamada ao Serviço ---
      refeicaoId = await refeicaoService.registrarRefeicao(refeicaoData);
      // --------------------------
      
      reverterContagemSemanal = false; 

      toast({ title: "Sucesso!", description: `${acao} registrado com sucesso!` });
      logAction('CREATE', 'REFEICOES', `Refeição (${tipoRefeicao}) registrada como ${tipoEfetivoParaSalvar}`, { 
        alunoId: alunoParaMarcar.id,
        alunoNome: alunoParaMarcar.nome,
        refeicaoId: refeicaoId,
        tipoOriginal: tipoAlunoOriginal,
        tipoConsumo: tipoEfetivoParaSalvar
      });

      onRefeicaoMarcada();

    } catch (error: any) {
      console.error(`Erro ao ${acao}:`, error);
      toast({ title: "Erro", description: `Falha ao ${acao}. ${error.message}`, variant: "destructive" });
      
      // Reverter contagem se necessário
      if (reverterContagemSemanal && tipoEfetivoParaSalvar !== 'AVULSO') { 
         setRefeicoesSemanais(prev => ({
           ...prev,
           [alunoParaMarcar.id]: {
             ...prev[alunoParaMarcar.id],
             [tipoRefeicao]: Math.max(0, (prev[alunoParaMarcar.id]?.[tipoRefeicao] ?? 1) - 1)
           }
         }));
      }

      logAction('ERROR', 'REFEICOES', `Falha ao registrar Refeição (${tipoRefeicao}) como ${tipoEfetivoParaSalvar}`, { 
        alunoId: alunoParaMarcar?.id,
        alunoNome: alunoParaMarcar?.nome,
        tipoRefeicao: tipoRefeicao,
        refeicaoIdTentativa: refeicaoId, 
        erro: error.message
      });
    } finally {
      setAlunoSelecionado(null);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Registro Rápido de Refeições - {dataFormatada}
      </Typography>
      
      {/* Filtros */} 
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Label htmlFor="filtro-nome">Buscar por Nome</Label>
          <Input 
            id="filtro-nome"
            placeholder="Digite nome do aluno..." 
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="filtro-turma">Filtrar por Turma</Label>
          <Select 
            value={turmaFiltro}
            onValueChange={setTurmaFiltro}
          >
            <SelectTrigger id="filtro-turma" className="w-full">
              <SelectValue placeholder="Todas as Turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {turmasUnicas.map(turma => (
                <SelectItem key={turma} value={turma}>
                  {turma}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Alunos */} 
      <Grid container spacing={2}>
        {alunosFiltrados.length > 0 ? (
          alunosFiltrados.map(aluno => {
            const refeicoesHoje = alunosComeram[aluno.id] || {};
            const limiteSemanalConfig = LIMITE_REFEICOES[aluno.tipo];
            const contagemSemanal = refeicoesSemanais[aluno.id] || {};
            const tipoAluno = aluno.tipo;
            const diasPermitidos = aluno.diasRefeicaoPermitidos || [];
            const diaDaSemanaAtual = data.getDay();
            const ehDiaPermitido = !tipoAluno.startsWith('INTEGRAL') || diasPermitidos.length === 0 || diasPermitidos.includes(diaDaSemanaAtual);
            
            let statusAluno = `Tipo: ${tipoAluno}`;
            if (tipoAluno.startsWith('INTEGRAL') && diasPermitidos.length > 0) {
               const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
               statusAluno += ` (${diasPermitidos.map(d => nomesDias[d]).join(', ')})`;
            }

            return (
              <Grid item xs={12} sm={6} md={4} key={aluno.id}>
                <Card 
                  sx={{ 
                    p: 2, 
                    cursor: canWrite && aluno.ativo ? 'pointer' : 'default', 
                    opacity: aluno.ativo ? 1 : 0.6,
                    border: !ehDiaPermitido ? '2px solid orange' : undefined
                  }}
                  onClick={() => handleCardClick(aluno)}
                >
                  <Typography variant="subtitle1" component="div">
                    {aluno.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {aluno.turma}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom sx={{ fontSize: '0.75rem' }}>
                    {statusAluno}
                    {!aluno.ativo && ' (INATIVO)'} 
                    {!ehDiaPermitido && ' (Dia não permitido)'}
                  </Typography>
                  
                  {/* Mostrar ícones das refeições do dia */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {TIPOS_REFEICAO.map(tipo => {
                      const comeu = !!refeicoesHoje[tipo.id];
                      const Icone = tipo.icon;
                      const limiteTipo = limiteSemanalConfig?.[tipo.id] ?? 999;
                      const contagemTipo = contagemSemanal?.[tipo.id] ?? 0;
                      const atingiuLimite = tipoAluno !== 'MENSALISTA' && tipoAluno !== 'AVULSO' && contagemTipo >= limiteTipo;

                      let tooltip = `${tipo.nome}${atingiuLimite ? ' (Limite semanal atingido)' : ''}`;
                      if (comeu) {
                        tooltip += ` - Já comeu hoje`;
                      }
                      
                      return (
                        <IconButton 
                          key={tipo.id} 
                          size="small" 
                          title={tooltip} 
                          sx={{ 
                            opacity: comeu ? 1 : 0.5,
                            border: atingiuLimite ? '2px solid red' : undefined,
                            padding: '4px' 
                          }}
                        >
                          <Icone 
                            fontSize="small" 
                            sx={{ color: comeu ? tipo.color : 'grey' }} 
                          />
                        </IconButton>
                      );
                    })}
                  </Box>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">Nenhum aluno encontrado com os filtros aplicados.</Alert>
          </Grid>
        )}
      </Grid>

      {/* Diálogo para Marcar Refeição */} 
      <Dialog open={dialogoAberto} onClose={() => setDialogoAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Marcar Refeição para {alunoSelecionado?.nome}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} justifyContent="center">
            {TIPOS_REFEICAO.map(tipo => {
              if (!alunoSelecionado) return null;
              
              const comeu = !!alunosComeram[alunoSelecionado.id]?.[tipo.id];
              const limiteSemanalAluno = LIMITE_REFEICOES[alunoSelecionado.tipo];
              const limiteTipoEspecifico = limiteSemanalAluno?.[tipo.id] ?? 999;
              const contagemSemanalTipo = refeicoesSemanais[alunoSelecionado.id]?.[tipo.id] ?? 0;
              const atingiuLimiteCalculado = alunoSelecionado.tipo !== 'MENSALISTA' && alunoSelecionado.tipo !== 'AVULSO' && contagemSemanalTipo >= limiteTipoEspecifico;
              const diaDaSemanaAtual = data.getDay();
              const diasPermitidosAluno = alunoSelecionado.diasRefeicaoPermitidos || [];
              const tipoAlunoDialog = alunoSelecionado.tipo;
              const ehTipoComLimiteDialog = tipoAlunoDialog?.startsWith('INTEGRAL');
              const ehDiaNaoPermitidoDialog = ehTipoComLimiteDialog && diasPermitidosAluno.length > 0 && !diasPermitidosAluno.includes(diaDaSemanaAtual);

              const isDisabled = comeu || !canWrite;
              const isAvulsoPrevisto = ehDiaNaoPermitidoDialog || atingiuLimiteCalculado || tipoAlunoDialog === 'AVULSO';

              return (
                <Grid item xs={6} key={tipo.id}>
                  <Button 
                    variant="contained" 
                    startIcon={<tipo.icon />} 
                    fullWidth
                    onClick={() => handleMarcarRefeicao(tipo.id)}
                    disabled={isDisabled}
                    sx={{
                      backgroundColor: isDisabled ? 'grey' : tipo.color,
                      color: 'white',
                      opacity: isDisabled ? 0.6 : 1,
                      position: 'relative'
                    }}
                  >
                    {tipo.nome}
                    {isAvulsoPrevisto && !isDisabled && (
                       <span style={{
                         position: 'absolute', 
                         top: 2, 
                         right: 2, 
                         background: 'orange', 
                         color: 'white', 
                         borderRadius: '4px', 
                         padding: '1px 3px', 
                         fontSize: '0.6rem'
                       }}>AVULSO</span>
                    )}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
