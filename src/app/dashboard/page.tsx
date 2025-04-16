'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AtividadesRecentes } from '@/components/atividades/AtividadesRecentes';
import { usePermissions } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';
import { alunoService } from '@/services/alunoService';
import { refeicaoService } from '@/services/refeicaoService';
import { Aluno, AlunoTipo } from '@/types/aluno';
import { Refeicao, TipoRefeicao, TIPOS_REFEICAO } from '@/types/refeicao';

// Definir labels localmente
const TIPOS_ALUNO_LABELS: Record<AlunoTipo, string> = {
  AVULSO: 'Avulso',
  AVULSO_RESTAURANTE: 'Avulso (Restaurante)',
  AVULSO_SECRETARIA: 'Avulso (Secretaria)',
  INTEGRAL_5X: 'Integral 5x',
  INTEGRAL_4X: 'Integral 4x',
  INTEGRAL_3X: 'Integral 3x',
  INTEGRAL_2X: 'Integral 2x',
  INTEGRAL_1X: 'Integral 1x',
  MENSALISTA: 'Mensalista',
  MENSALISTA_GRATUIDADE: 'Mensalista (Gratuidade)',
  SEMI_INTEGRAL: 'Semi Integral',
  ESTENDIDO: 'Estendido',
  ESTENDIDO_5X: 'Estendido 5x',
  ESTENDIDO_4X: 'Estendido 4x',
  ESTENDIDO_3X: 'Estendido 3x',
  ESTENDIDO_2X: 'Estendido 2x',
  ESTENDIDO_1X: 'Estendido 1x',
  ADESAO: 'Adesão'
};

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const { perfil, isOperador, isProfessor, isCoordenador, isAdmin } = usePermissions();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [refeicoesHoje, setRefeicoesHoje] = useState<Refeicao[]>([]);
  const [refeicoesAvulsasHojeCount, setRefeicoesAvulsasHojeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState<Refeicao | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  useEffect(() => {
    console.log('Perfil do usuário:', perfil);
    console.log('userData:', userData);
    console.log('É operador?', isOperador);
    console.log('É administrador?', isAdmin);
    console.log('Email do usuário:', user?.email);
    
    // Verificar se o email do usuário é de administrador
    if (user?.email && (
      user.email === 'admin@bemestar.com' || 
      user.email === 'teste@teste.com' || 
      user.email === 'rodrigo.carvalho@jpiaget.com.br' ||
      user.email === 'adriana.diari@jpiaget.com.br'
    )) {
      setIsAdminUser(true);
      console.log('É administrador por email!');
    }
    
    // Verificar se o email do usuário contém "restaurante"
    if (user?.email && user.email.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('É usuário do restaurante!');
    }

    const carregarDados = async () => {
      setLoading(true);
      try {
        // Carregar dados reais do sistema
        const alunosData = await alunoService.listarAlunos();
        
        // Buscar refeições recentes (últimos 30 dias)
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
        hoje.setHours(23, 59, 59, 999);
        
        const refeicoesData = await refeicaoService.listarRefeicoes({ 
          dataInicio: dataInicio,
          dataFim: hoje
        });
        
        // Filtrar refeições de hoje
        const inicioHoje = new Date();
        inicioHoje.setHours(0, 0, 0, 0);
        
        const refeicoesHojeData = refeicoesData.filter(ref => {
          const dataRefeicao = new Date(ref.data);
          return dataRefeicao >= inicioHoje;
        });
        
        // Calcular refeições avulsas de hoje
        const avulsasHoje = refeicoesHojeData.filter(ref => ref.tipoConsumo === 'AVULSO').length;
        setRefeicoesAvulsasHojeCount(avulsasHoje);
        
        setAlunos(alunosData);
        setRefeicoes(refeicoesData);
        setRefeicoesHoje(refeicoesHojeData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [perfil, userData, isOperador, isAdmin, user]);

  const alunosAtivos = alunos.filter((a: Aluno) => a.ativo).length;
  const refeicoesRegistradas = refeicoes.length;
  const refeicoesHojeCount = refeicoesHoje.length;

  // Função para lidar com o clique no botão "Ver detalhes"
  const handleVerDetalhes = (refeicao: Refeicao) => {
    setRefeicaoSelecionada(refeicao);
    setDialogoAberto(true);
  };

  // Função para fechar o diálogo de detalhes
  const handleFecharDetalhes = () => {
    setDialogoAberto(false);
    setRefeicaoSelecionada(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Bem-vindo ao Sistema BemEstar!
      </h1>
      
      <p className="text-muted-foreground">
        Acompanhe as informações de refeições e alunos.
      </p>

      {/* Cards com estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alunos Ativos
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alunosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Alunos com status ativo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Refeições Hoje
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refeicoesHojeCount}</div>
            <p className="text-xs text-muted-foreground">
              Refeições registradas hoje
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Alunos
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alunos.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de alunos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Refeições (30 dias)
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refeicoesRegistradas}</div>
            <p className="text-xs text-muted-foreground">
              Refeições nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        {/* NOVO CARD: Refeições Avulsas Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Refeições Avulsas Hoje
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <line x1="12" x2="12" y1="2" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refeicoesAvulsasHojeCount}</div>
            <p className="text-xs text-muted-foreground">
              Refeições registradas como Avulso hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de refeições de hoje */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Refeições de Hoje</h2>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Aluno</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Horário</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Turma</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">Carregando...</td>
                  </tr>
                ) : refeicoesHoje.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">Nenhuma refeição registrada hoje</td>
                  </tr>
                ) : (
                  refeicoesHoje.map((refeicao: Refeicao) => {
                    const aluno = alunos.find((a: Aluno) => a.id === refeicao.alunoId);
                    return (
                      <tr key={refeicao.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">{aluno?.nome || 'Aluno não encontrado'}</td>
                        <td className="p-4 align-middle">{new Date(refeicao.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-4 align-middle">{refeicao.tipo}</td>
                        <td className="p-4 align-middle">{aluno?.turma || '-'}</td>
                        <td className="p-4 align-middle">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerDetalhes(refeicao)}
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Diálogo de detalhes da refeição */}
      {dialogoAberto && refeicaoSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Detalhes da Refeição</h3>
              <button
                onClick={handleFecharDetalhes}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const aluno = alunos.find((a: Aluno) => a.id === refeicaoSelecionada.alunoId);
                return (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Aluno</p>
                      <p className="mt-1">{aluno?.nome || 'Aluno não encontrado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Turma</p>
                      <p className="mt-1">{aluno?.turma || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Refeição</p>
                      <p className="mt-1">{refeicaoSelecionada.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Consumo</p>
                      <p className="mt-1">
                        {refeicaoSelecionada.tipoConsumo
                          ? TIPOS_ALUNO_LABELS[refeicaoSelecionada.tipoConsumo]
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data e Hora</p>
                      <p className="mt-1">
                        {new Date(refeicaoSelecionada.data).toLocaleDateString('pt-BR')} às {' '}
                        {new Date(refeicaoSelecionada.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="mt-1">
                        {refeicaoSelecionada.presente ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Presente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Ausente
                          </span>
                        )}
                      </p>
                    </div>
                    {refeicaoSelecionada.observacao && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Observação</p>
                        <p className="mt-1">{refeicaoSelecionada.observacao}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleFecharDetalhes}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Links para diferentes seções */}
      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gerenciar Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/alunos">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registrar Refeições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/refeicoes">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/relatorios">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <div className="mt-8">
        <AtividadesRecentes limite={10} />
      </div>
    </div>
  );
}