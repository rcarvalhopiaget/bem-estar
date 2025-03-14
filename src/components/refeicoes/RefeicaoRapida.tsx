import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Typography, Box, TextField, Alert } from '@mui/material';
import { Aluno } from '@/types/aluno';
import { refeicaoService } from '@/services/refeicaoService';
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

export default function RefeicaoRapida({ alunos, data, onRefeicaoMarcada }: Props) {
  const [busca, setBusca] = useState('');
  const [alunosComeram, setAlunosComeram] = useState<Record<string, boolean>>({});
  const [refeicoesSemanais, setRefeicoesSemanais] = useState<Record<string, number>>({});

  // Carregar refeições do dia atual
  useEffect(() => {
    const carregarRefeicoes = async () => {
      try {
        const refeicoes = await refeicaoService.listarRefeicoes({ data });
        const comeram: Record<string, boolean> = {};
        refeicoes.forEach(refeicao => {
          if (refeicao.presente) {
            comeram[refeicao.alunoId] = true;
          }
        });
        setAlunosComeram(comeram);
      } catch (error) {
        console.error('Erro ao carregar refeições:', error);
        toast.error('Erro ao carregar refeições do dia');
      }
    };

    carregarRefeicoes();
  }, [data]);

  const alunosFiltrados = alunos.filter(aluno => {
    const termoBusca = busca.toLowerCase();
    return (
      aluno.nome.toLowerCase().includes(termoBusca) ||
      aluno.turma.toLowerCase().includes(termoBusca)
    );
  });

  const handleClick = async (aluno: Aluno) => {
    // Se já comeu hoje, não permite marcar novamente
    if (alunosComeram[aluno.id]) {
      toast.error('Aluno já marcou refeição hoje');
      return;
    }

    try {
      const refeicoesSemana = refeicoesSemanais[aluno.id] || 0;
      const limiteRefeicoes = LIMITE_REFEICOES[aluno.tipo] || 0;

      // Verifica se excedeu a cota (apenas alerta, não bloqueia)
      if (refeicoesSemana >= limiteRefeicoes) {
        toast.error(`Alerta: ${aluno.nome} excedeu a cota semanal de refeições (${limiteRefeicoes})`);
      }

      await refeicaoService.registrarRefeicao({
        alunoId: aluno.id,
        nomeAluno: aluno.nome,
        turma: aluno.turma,
        data: new Date(data),
        tipo: 'ALMOCO',
        presente: true
      });

      // Atualiza o estado local
      setAlunosComeram(prev => ({
        ...prev,
        [aluno.id]: true
      }));
      setRefeicoesSemanais(prev => ({
        ...prev,
        [aluno.id]: (prev[aluno.id] || 0) + 1
      }));

      onRefeicaoMarcada();
      toast.success('Refeição registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar refeição:', error);
      toast.error('Erro ao registrar refeição');
    }
  };

  // Formata a data usando date-fns v4.1.0 com locale ptBR
  const dataFormatada = format(data, 'EEEE, d \'de\' MMMM', { locale: ptBR });

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
              onClick={() => !jaComeu && handleClick(aluno)}
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
    </Box>
  );
}
