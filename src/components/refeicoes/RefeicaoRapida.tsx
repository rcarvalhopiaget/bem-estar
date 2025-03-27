'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Box, TextField, Alert, Dialog, DialogTitle, DialogContent, Grid, IconButton } from '@mui/material';
import { Aluno } from '@/types/aluno';
import { refeicaoService } from '@/services/refeicaoService';
import { TipoRefeicao } from '@/types/refeicao';
import { toast } from '@/components/ui/toast-wrapper';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

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
  const [busca, setBusca] = useState('');
  const [alunosComeram, setAlunosComeram] = useState<Record<string, Partial<Record<TipoRefeicao, boolean>>>>({});
  const [refeicoesSemanais, setRefeicoesSemanais] = useState<Record<string, Record<TipoRefeicao, number>>>({});
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const { perfil, isAdmin } = usePermissions();
  const { user } = useAuth();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  
  useEffect(() => {
    // Verificar se o email do usuário contém "restaurante"
    if (user?.email && user.email.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('RefeicaoRapida: É usuário do restaurante!');
    }
  }, [user]);
  
  // Filtrar tipos de refeição com base no perfil do usuário
  // Operadores (incluindo usuário do restaurante) veem todas as opções
  const TIPOS_REFEICAO = TODOS_TIPOS_REFEICAO;

  // Formata a data de forma simplificada
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(data);

  // Função para verificar se duas datas são o mesmo dia
  const isMesmoDia = (data1: Date, data2: Date): boolean => {
    return (
      data1.getDate() === data2.getDate() &&
      data1.getMonth() === data2.getMonth() &&
      data1.getFullYear() === data2.getFullYear()
    );
  };

  // Carregar refeições do dia atual e da semana
  useEffect(() => {
    const carregarRefeicoes = async () => {
      try {
        // Limpa o estado anterior quando a data muda
        setAlunosComeram({});
        
        // Calcula o início e fim do dia selecionado
        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(data);
        dataFim.setHours(23, 59, 59, 999);
        
        // Carrega refeições do dia selecionado apenas com filtro de data
        // Evita usar múltiplos filtros que exigiriam índices compostos
        const refeicoes = await refeicaoService.listarRefeicoes({ 
          dataInicio, 
          dataFim
        });
        
        // Filtra as refeições com presente=true no lado do cliente
        const refeicoesPresentes = refeicoes.filter(refeicao => refeicao.presente === true);
        
        const comeram: Record<string, Partial<Record<TipoRefeicao, boolean>>> = {};
        
        // Apenas processa refeições se a data selecionada for a data atual
        const hoje = new Date();
        if (isMesmoDia(data, hoje)) {
          refeicoesPresentes.forEach(refeicao => {
            if (!comeram[refeicao.alunoId]) {
              comeram[refeicao.alunoId] = {};
            }
            comeram[refeicao.alunoId][refeicao.tipo] = true;
          });
        }
        setAlunosComeram(comeram);

        // Carrega refeições da semana para cada aluno
        const refeicoesSemanaisPorAluno: Record<string, Record<TipoRefeicao, number>> = {};
        await Promise.all(
          alunos.map(async (aluno) => {
            const refeicoesAluno = await refeicaoService.buscarRefeicoesSemana(aluno.id, data);
            
            // Inicializa contadores para cada tipo de refeição
            const contadores: Record<TipoRefeicao, number> = {
              LANCHE_MANHA: 0,
              ALMOCO: 0,
              LANCHE_TARDE: 0,
              SOPA: 0
            };

            // Conta refeições por tipo
            refeicoesAluno.forEach(refeicao => {
              contadores[refeicao.tipo]++;
            });

            refeicoesSemanaisPorAluno[aluno.id] = contadores;
          })
        );
        setRefeicoesSemanais(refeicoesSemanaisPorAluno);
      } catch (error) {
        console.error('Erro ao carregar refeições:', error instanceof Error ? error.message : JSON.stringify(error));
        toast.error('Erro ao carregar refeições do dia');
      }
    };

    carregarRefeicoes();
  }, [data, alunos]);

  const alunosFiltrados = alunos.filter(aluno => {
    const termoBusca = busca.toLowerCase();
    return (
      aluno.nome.toLowerCase().includes(termoBusca) ||
      aluno.turma.toLowerCase().includes(termoBusca)
    );
  });

  const handleCardClick = (aluno: Aluno) => {
    // Verifica se a data selecionada é a data atual
    const hoje = new Date();
    if (!isMesmoDia(data, hoje)) {
      toast.error('Só é possível registrar refeições para o dia atual');
      return;
    }

    const refeicoesHoje = alunosComeram[aluno.id] || {};
    const todasRefeicoesFeitas = TIPOS_REFEICAO.every(tipo => refeicoesHoje[tipo.id]);

    if (todasRefeicoesFeitas) {
      toast.error('O aluno já realizou todas as refeições de hoje');
      return;
    }

    setAlunoSelecionado(aluno);
    setDialogoAberto(true);
  };

  const handleTipoRefeicaoClick = async (tipoRefeicao: TipoRefeicao) => {
    if (!alunoSelecionado) return;

    const refeicoesHoje = alunosComeram[alunoSelecionado.id] || {};
    if (refeicoesHoje[tipoRefeicao]) {
      toast.error('Esta refeição já foi registrada hoje');
      return;
    }

    try {
      const refeicoesPorTipo = refeicoesSemanais[alunoSelecionado.id] || {
        LANCHE_MANHA: 0,
        ALMOCO: 0,
        LANCHE_TARDE: 0,
        SOPA: 0
      };
      const limitesPorTipo = LIMITE_REFEICOES[alunoSelecionado.tipo] || {
        LANCHE_MANHA: 0,
        ALMOCO: 0,
        LANCHE_TARDE: 0,
        SOPA: 0
      };

      // Verifica se excedeu a cota para este tipo específico de refeição
      if (refeicoesPorTipo[tipoRefeicao] >= limitesPorTipo[tipoRefeicao]) {
        toast(`Atenção: Cota semanal de ${TIPOS_REFEICAO.find(t => t.id === tipoRefeicao)?.nome} excedida`, { 
          icon: '⚠️',
          duration: 4000
        });
      }

      // Atualiza o estado das refeições do aluno primeiro
      setAlunosComeram(prev => ({
        ...prev,
        [alunoSelecionado.id]: {
          ...prev[alunoSelecionado.id],
          [tipoRefeicao]: true
        }
      }));

      await refeicaoService.registrarRefeicao({
        alunoId: alunoSelecionado.id,
        nomeAluno: alunoSelecionado.nome,
        turma: alunoSelecionado.turma,
        data: new Date(data),
        tipo: tipoRefeicao,
        presente: true
      });

      onRefeicaoMarcada();
      toast.success('Refeição registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Não foi possível registrar a refeição');
    } finally {
      setDialogoAberto(false);
      setAlunoSelecionado(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          textTransform: 'capitalize',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}
      >
        {dataFormatada}
        {!isMesmoDia(data, new Date()) && (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              mb: 1 
            }}
          >
            Visualizando dados históricos. Apenas o dia atual permite registrar refeições.
          </Alert>
        )}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome ou turma do aluno..."
        value={busca}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            fontSize: { xs: '1rem', sm: '1.1rem' }
          }
        }}
      />

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(auto-fill, minmax(250px, 1fr))'
        },
        gap: { xs: 1, sm: 2 }
      }}>
        {alunosFiltrados.map((aluno) => {
          const refeicoesHoje = alunosComeram[aluno.id] || {};
          const refeicoesPorTipo = refeicoesSemanais[aluno.id] || {
            LANCHE_MANHA: 0,
            ALMOCO: 0,
            LANCHE_TARDE: 0,
            SOPA: 0
          };
          const limitesPorTipo = LIMITE_REFEICOES[aluno.tipo] || {
            LANCHE_MANHA: 0,
            ALMOCO: 0,
            LANCHE_TARDE: 0,
            SOPA: 0
          };
          
          // Calcula o total de refeições restantes somando todos os tipos
          const refeicaoRestante = Object.entries(limitesPorTipo).reduce((total, [tipo, limite]) => {
            return total + (limite - (refeicoesPorTipo[tipo as TipoRefeicao] || 0));
          }, 0);
          
          // Verifica se excedeu a cota em qualquer tipo de refeição
          const excedeuCota = Object.entries(limitesPorTipo).some(([tipo, limite]) => 
            (refeicoesPorTipo[tipo as TipoRefeicao] || 0) >= limite
          );
          
          // Verifica se está na última refeição em qualquer tipo
          const ultimaRefeicao = Object.entries(limitesPorTipo).some(([tipo, limite]) => 
            (refeicoesPorTipo[tipo as TipoRefeicao] || 0) === limite - 1
          );
          const todasRefeicoesFeitas = TIPOS_REFEICAO.every(tipo => refeicoesHoje[tipo.id]);

          return (
            <Card
              key={aluno.id}
              onClick={() => !todasRefeicoesFeitas && handleCardClick(aluno)}
              sx={{
                p: { xs: 1.5, sm: 2 },
                cursor: todasRefeicoesFeitas ? 'default' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: todasRefeicoesFeitas ? 'none' : 'scale(1.02)',
                  boxShadow: todasRefeicoesFeitas ? 1 : 3
                },
                '&:active': {
                  transform: todasRefeicoesFeitas ? 'none' : 'scale(0.98)'
                },
                minHeight: { xs: '100px', sm: '120px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: Object.values(refeicoesHoje).some(Boolean) ? '#e8f5e9' : 'white',
                borderColor: todasRefeicoesFeitas ? 'success.main' : excedeuCota ? 'warning.main' : ultimaRefeicao ? 'warning.light' : 'grey.300',
                borderWidth: 1,
                borderStyle: 'solid'
              }}
            >
              <Box>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  {aluno.nome}
                </Typography>
                <Typography 
                  color="textSecondary" 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {aluno.turma}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {TIPOS_REFEICAO.map((tipo) => {
                  const Icon = tipo.icon;
                  const refeicaoMarcada = refeicoesHoje[tipo.id];
                  return (
                    <Box
                      key={tipo.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        width: window.innerWidth < 600 ? 32 : 40,
                        height: window.innerWidth < 600 ? 32 : 40,
                        backgroundColor: refeicaoMarcada ? tipo.color : 'transparent',
                        color: refeicaoMarcada ? 'white' : 'grey.400',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon fontSize={window.innerWidth < 600 ? "small" : "medium"} />
                    </Box>
                  );
                })}
              </Box>

              {todasRefeicoesFeitas ? (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 1,
                    py: { xs: 0.5, sm: 1 },
                    '& .MuiAlert-message': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }
                  }}
                >
                  Todas as refeições foram registradas
                </Alert>
              ) : excedeuCota ? (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 1,
                    py: { xs: 0.5, sm: 1 },
                    '& .MuiAlert-message': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }
                  }}
                >
                  Cota semanal de refeições excedida
                </Alert>
              ) : (
                <Typography 
                  color="textSecondary" 
                  sx={{ 
                    mt: 1, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {refeicaoRestante} {refeicaoRestante === 1 ? 'refeição restante' : 'refeições restantes'}
                </Typography>
              )}
            </Card>
          );
        })}
      </Box>

      <Dialog 
        open={dialogoAberto} 
        onClose={() => setDialogoAberto(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: { xs: '95%', sm: '400px' },
            borderRadius: 2,
            overflow: 'hidden',
            m: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1, 
          bgcolor: 'primary.main',
          color: 'white',
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          Selecione a refeição
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2}>
            {TIPOS_REFEICAO.map((tipo) => {
              const refeicoesHoje = alunoSelecionado ? (alunosComeram[alunoSelecionado.id] || {}) : {};
              const jaComeu = refeicoesHoje[tipo.id];
              const Icon = tipo.icon;

              return (
                <Grid item xs={12} key={tipo.id}>
                  <Box
                    onClick={() => !jaComeu && handleTipoRefeicaoClick(tipo.id)}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      cursor: jaComeu ? 'default' : 'pointer',
                      bgcolor: jaComeu ? 'grey.100' : 'white',
                      border: 1,
                      borderColor: jaComeu ? 'grey.300' : 'primary.main',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: jaComeu ? 'none' : 'scale(1.02)',
                        bgcolor: jaComeu ? 'grey.100' : 'primary.50',
                      },
                      '&:active': {
                        transform: jaComeu ? 'none' : 'scale(0.98)'
                      },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <IconButton 
                      sx={{ 
                        bgcolor: jaComeu ? 'grey.300' : 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: jaComeu ? 'grey.300' : 'primary.dark',
                        },
                        p: { xs: 1, sm: 1.5 }
                      }}
                      disabled={jaComeu}
                    >
                      <Icon fontSize={window.innerWidth < 600 ? "small" : "medium"} />
                    </IconButton>
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: jaComeu ? 'grey.500' : 'inherit',
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {tipo.nome}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: jaComeu ? 'grey.500' : 'text.secondary',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Horário: {tipo.horario}
                      </Typography>
                    </Box>
                    {jaComeu && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 'auto',
                          color: 'grey.500',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Registrado
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
