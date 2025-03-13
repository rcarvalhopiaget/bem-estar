import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aluno } from '@/types/aluno';
import { RefeicaoFormData, TIPOS_REFEICAO, TipoRefeicao } from '@/types/refeicao';
import { refeicaoService } from '@/services/refeicaoService';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from 'react-hot-toast';

interface Props {
  alunos: Aluno[];
  onRefeicaoMarcada: () => void;
}

interface StatusCota {
  excedeuCota: boolean;
  ultimaRefeicao: boolean;
  refeicaoRestante: number;
}

const LIMITE_REFEICOES: Record<string, number> = {
  'INTEGRAL_5X': 5,
  'INTEGRAL_4X': 4,
  'INTEGRAL_3X': 3,
  'INTEGRAL_2X': 2,
  'MENSALISTA': 999 // Sem limite prático
};

interface RefeicoesHoje {
  ALMOCO?: boolean;
  LANCHE_MANHA?: boolean;
  LANCHE_TARDE?: boolean;
}

export function RefeicaoRapida({ alunos = [], onRefeicaoMarcada }: Props) {
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [refeicoesHoje, setRefeicoesHoje] = useState<Record<string, RefeicoesHoje>>({});
  const [dataSelecionada] = useState(new Date());

  useEffect(() => {
    carregarRefeicoesDoDia();
  }, []);

  const carregarRefeicoesDoDia = async () => {
    try {
      const data = new Date(dataSelecionada);
      data.setHours(0, 0, 0, 0);
      const refeicoes = await refeicaoService.listarRefeicoes({ data });
      
      const refeicoesMap: Record<string, RefeicoesHoje> = {};
      refeicoes.forEach(refeicao => {
        if (refeicao.presente) {
          refeicoesMap[refeicao.alunoId] = {
            ...refeicoesMap[refeicao.alunoId],
            [refeicao.tipo]: true
          };
        }
      });
      setRefeicoesHoje(refeicoesMap);
    } catch (error) {
      console.error('Erro ao carregar refeições:', error);
      toast.error('Erro ao carregar refeições do dia');
    }
  };

  const marcarRefeicao = async (tipo: TipoRefeicao) => {
    if (!alunoSelecionado) return;

    setLoading(true);
    try {
      const dados: RefeicaoFormData = {
        alunoId: alunoSelecionado.id,
        nomeAluno: alunoSelecionado.nome,
        turma: alunoSelecionado.turma,
        data: new Date(dataSelecionada),
        tipo,
        presente: true
      };

      await refeicaoService.registrarRefeicao(dados);
      setRefeicoesHoje(prev => ({
        ...prev,
        [alunoSelecionado.id]: {
          ...prev[alunoSelecionado.id],
          [tipo]: true
        }
      }));
      toast.success('Refeição registrada com sucesso!');
      onRefeicaoMarcada();
    } catch (error) {
      console.error('Erro ao marcar refeição:', error);
      toast.error('Erro ao registrar refeição');
    } finally {
      setLoading(false);
      setAlunoSelecionado(null);
    }
  };

  const alunosFiltrados = alunos.filter(aluno => {
    const termoBusca = busca.toLowerCase();
    return (
      aluno.nome.toLowerCase().includes(termoBusca) ||
      aluno.turma.toLowerCase().includes(termoBusca)
    );
  });

  const verificarCotaSemanal = (aluno: Aluno): Record<TipoRefeicao, StatusCota> => {
    const cotaMaxima = LIMITE_REFEICOES[aluno.tipo] || 0;
    // TODO: Implementar contagem real da semana por tipo
    const cotaAtual = {
      ALMOCO: 0,
      LANCHE_MANHA: 0,
      LANCHE_TARDE: 0
    };

    return {
      ALMOCO: {
        excedeuCota: cotaAtual.ALMOCO >= cotaMaxima,
        ultimaRefeicao: cotaAtual.ALMOCO === cotaMaxima - 1,
        refeicaoRestante: cotaMaxima - cotaAtual.ALMOCO
      },
      LANCHE_MANHA: {
        excedeuCota: cotaAtual.LANCHE_MANHA >= cotaMaxima,
        ultimaRefeicao: cotaAtual.LANCHE_MANHA === cotaMaxima - 1,
        refeicaoRestante: cotaMaxima - cotaAtual.LANCHE_MANHA
      },
      LANCHE_TARDE: {
        excedeuCota: cotaAtual.LANCHE_TARDE >= cotaMaxima,
        ultimaRefeicao: cotaAtual.LANCHE_TARDE === cotaMaxima - 1,
        refeicaoRestante: cotaMaxima - cotaAtual.LANCHE_TARDE
      }
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-2xl text-gray-600">
          {format(dataSelecionada, "EEEE, d 'de' MMMM", { locale: ptBR })} • {format(dataSelecionada, 'yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nome ou turma..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full p-4 text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {alunosFiltrados.map((aluno) => {
          const cotasPorTipo = verificarCotaSemanal(aluno);
          const refeicoesDoAluno = refeicoesHoje[aluno.id] || {};
          
          // Verifica se algum tipo está com a cota excedida
          const temCotaExcedida = Object.values(cotasPorTipo).some(cota => cota.excedeuCota);
          // Verifica se algum tipo está na última refeição
          const temUltimaRefeicao = Object.values(cotasPorTipo).some(cota => cota.ultimaRefeicao);

          const cardClass = temCotaExcedida
            ? 'border-yellow-500 bg-yellow-50'
            : temUltimaRefeicao
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-primary';

          return (
            <div
              key={aluno.id}
              onClick={() => setAlunoSelecionado(aluno)}
              className={`p-6 rounded-lg border-2 ${cardClass} cursor-pointer transition-colors`}
            >
              <h3 className="text-xl font-semibold mb-1">{aluno.nome}</h3>
              <p className="text-lg text-gray-600">{aluno.turma}</p>
              
              {/* Status das refeições de hoje */}
              {refeicoesDoAluno.ALMOCO && (
                <p className="bg-green-100 text-green-600 text-sm mt-2 font-medium p-2 rounded">
                  ✓ Almoçou hoje
                </p>
              )}
              {refeicoesDoAluno.LANCHE_MANHA && (
                <p className="bg-green-100 text-green-600 text-sm mt-2 font-medium p-2 rounded">
                  ✓ Lanche da manhã hoje
                </p>
              )}
              {refeicoesDoAluno.LANCHE_TARDE && (
                <p className="bg-green-100 text-green-600 text-sm mt-2 font-medium p-2 rounded">
                  ✓ Lanche da tarde hoje
                </p>
              )}

              {/* Status das cotas por tipo */}
              {!refeicoesDoAluno.ALMOCO && cotasPorTipo.ALMOCO.excedeuCota && (
                <p className="bg-yellow-100 text-yellow-600 text-sm mt-2 font-medium p-2 rounded">
                  Cota de almoços excedida
                </p>
              )}
              {!refeicoesDoAluno.LANCHE_MANHA && cotasPorTipo.LANCHE_MANHA.excedeuCota && (
                <p className="bg-yellow-100 text-yellow-600 text-sm mt-2 font-medium p-2 rounded">
                  Cota de lanches da manhã excedida
                </p>
              )}
              {!refeicoesDoAluno.LANCHE_TARDE && cotasPorTipo.LANCHE_TARDE.excedeuCota && (
                <p className="bg-yellow-100 text-yellow-600 text-sm mt-2 font-medium p-2 rounded">
                  Cota de lanches da tarde excedida
                </p>
              )}

              {/* Refeições restantes por tipo */}
              {!refeicoesDoAluno.ALMOCO && !cotasPorTipo.ALMOCO.excedeuCota && (
                <p className="bg-gray-100 text-gray-600 text-sm mt-2 p-2 rounded">
                  {cotasPorTipo.ALMOCO.refeicaoRestante} almoços restantes
                </p>
              )}
              {!refeicoesDoAluno.LANCHE_MANHA && !cotasPorTipo.LANCHE_MANHA.excedeuCota && (
                <p className="bg-gray-100 text-gray-600 text-sm mt-2 p-2 rounded">
                  {cotasPorTipo.LANCHE_MANHA.refeicaoRestante} lanches da manhã restantes
                </p>
              )}
              {!refeicoesDoAluno.LANCHE_TARDE && !cotasPorTipo.LANCHE_TARDE.excedeuCota && (
                <p className="bg-gray-100 text-gray-600 text-sm mt-2 p-2 rounded">
                  {cotasPorTipo.LANCHE_TARDE.refeicaoRestante} lanches da tarde restantes
                </p>
              )}

              {/* Alertas especiais */}
              {temCotaExcedida && (
                <p className="text-yellow-600 text-sm mt-2 font-medium">
                  ⚠️ Cota semanal excedida
                </p>
              )}
              {temUltimaRefeicao && (
                <p className="text-orange-600 text-sm mt-2 font-medium">
                  ⚠️ Última refeição disponível
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmação */}
      <Dialog open={!!alunoSelecionado} onOpenChange={() => setAlunoSelecionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Refeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {alunoSelecionado && (
              <>
                <p className="text-lg">
                  Aluno: <strong>{alunoSelecionado.nome}</strong>
                </p>
                <p className="text-lg">
                  Turma: <strong>{alunoSelecionado.turma}</strong>
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(TIPOS_REFEICAO).map(([tipo, nome]) => {
                    const refeicoesDoAluno = alunoSelecionado ? refeicoesHoje[alunoSelecionado.id] || {} : {};
                    const jaComeuHoje = refeicoesDoAluno[tipo as TipoRefeicao];

                    return (
                      <Button
                        key={tipo}
                        onClick={() => marcarRefeicao(tipo as TipoRefeicao)}
                        disabled={loading || jaComeuHoje}
                        className={`h-16 text-xl font-medium ${jaComeuHoje ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed' : ''}`}
                      >
                        {nome} {jaComeuHoje ? '✓' : ''}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
