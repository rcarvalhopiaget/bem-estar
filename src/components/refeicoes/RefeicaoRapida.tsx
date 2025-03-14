'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Box, TextField, Alert, Dialog, DialogTitle, DialogContent, Grid, IconButton } from '@mui/material';
import { Aluno } from '@/types/aluno';
import { refeicaoService } from '@/services/refeicaoService';
import { TipoRefeicao } from '@/types/refeicao';
import { toast } from 'react-hot-toast';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CakeIcon from '@mui/icons-material/Cake';

interface Props {
  alunos: Aluno[];
  data: Date;
  onRefeicaoMarcada: () => void;
}

// Limites de refeições por tipo de aluno
const LIMITE_REFEICOES: Record<string, number> = {
  'INTEGRAL_5X': 5,
  'INTEGRAL_4X': 4,
  'INTEGRAL_3X': 3,
  'INTEGRAL_2X': 2,
  'MENSALISTA': 999 // Sem limite prático
};

// Tipos de refeição disponíveis
const TIPOS_REFEICAO = [
  { 
    id: 'LANCHE_MANHA' as TipoRefeicao, 
    nome: 'Lanche da Manhã', 
    horario: '09:30',
    icon: CoffeeIcon,
    color: '#ff9800'
  },
  { 
    id: 'ALMOCO' as TipoRefeicao, 
    nome: 'Almoço', 
    horario: '12:00',
    icon: RestaurantIcon,
    color: '#4caf50'
  },
  { 
    id: 'LANCHE_TARDE' as TipoRefeicao, 
    nome: 'Lanche da Tarde', 
    horario: '15:30',
    icon: CakeIcon,
    color: '#2196f3'
  }
];

export default function RefeicaoRapida({ alunos, data, onRefeicaoMarcada }: Props) {
  const [busca, setBusca] = useState('');
  const [alunosComeram, setAlunosComeram] = useState<Record<string, Partial<Record<TipoRefeicao, boolean>>>>({});
  const [refeicoesSemanais, setRefeicoesSemanais] = useState<Record<string, number>>({});
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  // Formata a data de forma simplificada
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(data);

  // Carregar refeições do dia atual e da semana
  useEffect(() => {
    const carregarRefeicoes = async () => {
      try {
        // Carrega refeições do dia
        const refeicoes = await refeicaoService.listarRefeicoes({ data });
        const comeram: Record<string, Partial<Record<TipoRefeicao, boolean>>> = {};
        
        refeicoes.forEach(refeicao => {
          if (refeicao.presente) {
            if (!comeram[refeicao.alunoId]) {
              comeram[refeicao.alunoId] = {};
            }
            comeram[refeicao.alunoId][refeicao.tipo] = true;
          }
        });
        setAlunosComeram(comeram);

        // Carrega refeições da semana para cada aluno
        const refeicoesSemanaisPorAluno: Record<string, number> = {};
        await Promise.all(
          alunos.map(async (aluno) => {
            const refeicoesAluno = await refeicaoService.buscarRefeicoesSemana(aluno.id, data);
            refeicoesSemanaisPorAluno[aluno.id] = refeicoesAluno.length;
          })
        );
        setRefeicoesSemanais(refeicoesSemanaisPorAluno);
      } catch (error) {
        console.error('Erro ao carregar refeições:', error);
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
    const refeicoesHoje = alunosComeram[aluno.id] || {};
    const todasRefeicoesFeitas = TIPOS_REFEICAO.every(tipo => refeicoesHoje[tipo.id]);

    if (todasRefeicoesFeitas) {
      toast.error('Aluno já marcou todas as refeições hoje');
      return;
    }

    setAlunoSelecionado(aluno);
    setDialogoAberto(true);
  };

  const handleTipoRefeicaoClick = async (tipoRefeicao: TipoRefeicao) => {
    if (!alunoSelecionado) return;

    const refeicoesHoje = alunosComeram[alunoSelecionado.id] || {};
    if (refeicoesHoje[tipoRefeicao]) {
      toast.error('Esta refeição já foi marcada hoje');
      return;
    }

    try {
      const refeicoesSemana = refeicoesSemanais[alunoSelecionado.id] || 0;
      const limiteRefeicoes = LIMITE_REFEICOES[alunoSelecionado.tipo] || 0;

      // Verifica se excedeu a cota (apenas alerta, não bloqueia)
      if (refeicoesSemana >= limiteRefeicoes) {
        toast('Alerta: Cota semanal excedida', { 
          icon: '⚠️',
          duration: 4000
        });
      }

      await refeicaoService.registrarRefeicao({
        alunoId: alunoSelecionado.id,
        nomeAluno: alunoSelecionado.nome,
        turma: alunoSelecionado.turma,
        data: new Date(data),
        tipo: tipoRefeicao,
        presente: true
      });

      // Atualiza o estado das refeições do aluno
      setAlunosComeram(prev => ({
        ...prev,
        [alunoSelecionado.id]: {
          ...prev[alunoSelecionado.id],
          [tipoRefeicao]: true
        }
      }));

      onRefeicaoMarcada();
      toast.success('Refeição registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar refeição:', error);
      toast.error('Erro ao registrar refeição');
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
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome ou turma..."
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
          const refeicoesSemana = refeicoesSemanais[aluno.id] || 0;
          const limiteRefeicoes = LIMITE_REFEICOES[aluno.tipo] || 0;
          const refeicaoRestante = limiteRefeicoes - refeicoesSemana;
          const excedeuCota = refeicoesSemana >= limiteRefeicoes;
          const ultimaRefeicao = refeicoesSemana === limiteRefeicoes - 1;
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
                bgcolor: todasRefeicoesFeitas ? '#e8f5e9' : excedeuCota ? '#fff3e0' : ultimaRefeicao ? '#fff8e1' : 'white',
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
                  return (
                    <Box
                      key={tipo.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: refeicoesHoje[tipo.id] ? tipo.color : 'grey.400',
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
                  Todas refeições registradas
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
                  Cota semanal excedida
                </Alert>
              ) : (
                <Typography 
                  color="textSecondary" 
                  sx={{ 
                    mt: 1, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {refeicaoRestante} refeição(ões) restante(s)
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
          Selecione o tipo de refeição
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
                      borderColor: jaComeu ? 'grey.300' : tipo.color,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: jaComeu ? 'none' : 'scale(1.02)',
                        bgcolor: jaComeu ? 'grey.100' : `${tipo.color}10`,
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
                        bgcolor: jaComeu ? 'grey.300' : tipo.color,
                        color: 'white',
                        '&:hover': {
                          bgcolor: jaComeu ? 'grey.300' : tipo.color,
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
