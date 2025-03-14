import { useState, useEffect } from 'react';
import { Card, Typography, Box, TextField, Alert, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { Aluno } from '@/types/aluno';
import { refeicaoService } from '@/services/refeicaoService';
import { TipoRefeicao } from '@/types/refeicao';
import { toast } from 'react-hot-toast';

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
  { id: 'LANCHE_MANHA' as TipoRefeicao, nome: 'Lanche da Manhã', horario: '09:30' },
  { id: 'ALMOCO' as TipoRefeicao, nome: 'Almoço', horario: '12:00' },
  { id: 'LANCHE_TARDE' as TipoRefeicao, nome: 'Lanche da Tarde', horario: '15:30' }
];

export default function RefeicaoRapida({ alunos, data, onRefeicaoMarcada }: Props) {
  const [busca, setBusca] = useState('');
  const [alunosComeram, setAlunosComeram] = useState<Record<string, boolean>>({});
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
        const comeram: Record<string, boolean> = {};
        refeicoes.forEach(refeicao => {
          if (refeicao.presente) {
            comeram[refeicao.alunoId] = true;
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
    // Se já comeu hoje, não permite marcar novamente
    if (alunosComeram[aluno.id]) {
      toast.error('Aluno já marcou refeição hoje');
      return;
    }

    setAlunoSelecionado(aluno);
    setDialogoAberto(true);
  };

  const handleTipoRefeicaoClick = async (tipoRefeicao: TipoRefeicao) => {
    if (!alunoSelecionado) return;

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

      // Atualiza apenas o estado de quem comeu hoje
      setAlunosComeram(prev => ({
        ...prev,
        [alunoSelecionado.id]: true
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
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textTransform: 'capitalize' }}>
        {dataFormatada}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nome ou turma..."
        value={busca}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 2 
      }}>
        {alunosFiltrados.map((aluno) => {
          const jaComeu = alunosComeram[aluno.id];
          const refeicoesSemana = refeicoesSemanais[aluno.id] || 0;
          const limiteRefeicoes = LIMITE_REFEICOES[aluno.tipo] || 0;
          const refeicaoRestante = limiteRefeicoes - refeicoesSemana;
          const excedeuCota = refeicoesSemana >= limiteRefeicoes;
          const ultimaRefeicao = refeicoesSemana === limiteRefeicoes - 1;

          return (
            <Card
              key={aluno.id}
              onClick={() => !jaComeu && handleCardClick(aluno)}
              sx={{
                p: 2,
                cursor: jaComeu ? 'default' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: jaComeu ? 'none' : 'scale(1.02)',
                  boxShadow: jaComeu ? 1 : 3
                },
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: jaComeu ? '#e8f5e9' : excedeuCota ? '#fff3e0' : ultimaRefeicao ? '#fff8e1' : 'white',
                borderColor: jaComeu ? 'success.main' : excedeuCota ? 'warning.main' : ultimaRefeicao ? 'warning.light' : 'grey.300',
                borderWidth: 1,
                borderStyle: 'solid'
              }}
            >
              <Box>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {aluno.nome}
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  {aluno.turma}
                </Typography>
              </Box>

              {jaComeu ? (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Refeição registrada
                </Alert>
              ) : excedeuCota ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Cota semanal excedida
                </Alert>
              ) : (
                <Typography color="textSecondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
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
            maxWidth: '400px',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          Selecione o tipo de refeição
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ pt: 0 }}>
            {TIPOS_REFEICAO.map((tipo) => (
              <ListItem key={tipo.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleTipoRefeicaoClick(tipo.id)}
                  sx={{
                    py: 2,
                    '&:hover': {
                      bgcolor: 'primary.light',
                      color: 'white'
                    }
                  }}
                >
                  <ListItemText 
                    primary={tipo.nome}
                    secondary={`Horário: ${tipo.horario}`}
                    primaryTypographyProps={{
                      sx: { fontWeight: 'medium' }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
