'use client';

import { useState, useEffect, useMemo } from 'react';
import { Aluno, AlunoFormData, AlunoTipo } from '@/types/aluno';
import { alunoService } from '@/services/alunoService';
import { AlunoForm } from '@/components/alunos/AlunoForm';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLogService } from '@/services/logService';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { containsTextNormalized } from '@/utils/stringUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Adicionar tipos para ordenação
type SortKey = keyof Pick<Aluno, 'nome' | 'matricula' | 'email' | 'tipo' | 'turma' | 'ativo'> | '';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// Labels para tipos de aluno (pode ser movido para um local compartilhado se usado em mais lugares)
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

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<Aluno | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(true); // Inicialmente mostra apenas ativos
  const [termoBusca, setTermoBusca] = useState(''); // Estado para busca
  const [turmas, setTurmas] = useState<string[]>([]); // Lista de turmas disponíveis
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('all'); // Turma selecionada para filtro
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nome', direction: 'ascending' }); // Estado para ordenação
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  
  const { logAction } = useLogService();
  const { toast } = useToast();
  const router = useRouter();

  // Carregar lista de alunos e turmas
  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setError(null); // Limpa erros anteriores
      // Agora busca todos e filtra no frontend
      // console.log('Iniciando carregamento de alunos com filtro:', { ativo: filtroAtivo });
      const data = await alunoService.listarAlunos(); // Remover filtro aqui, buscar todos
      // console.log('Alunos carregados:', data);
      setAlunos(data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      if (error instanceof Error) {
        setError(`Erro ao carregar alunos: ${error.message}`);
      } else {
        setError('Erro ao carregar alunos. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const carregarTurmas = async () => {
    try {
      const turmasData = await alunoService.listarTurmas();
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível carregar as turmas', 
        variant: 'destructive' 
      });
    }
  };

  useEffect(() => {
    carregarAlunos();
    carregarTurmas();
  }, []);

  // Lógica de filtragem e ordenação usando useMemo
  const alunosFiltradosOrdenados = useMemo(() => {
    let alunosFiltrados = [...alunos];

    // 1. Filtrar por status (ativo/inativo/todos)
    if (filtroAtivo !== undefined) {
      alunosFiltrados = alunosFiltrados.filter(aluno => aluno.ativo === filtroAtivo);
    }

    // 2. Filtrar por turma selecionada
    if (turmaSelecionada && turmaSelecionada !== 'all') {
      alunosFiltrados = alunosFiltrados.filter(aluno => aluno.turma === turmaSelecionada);
    }

    // 3. Filtrar por termo de busca
    if (termoBusca) {
      alunosFiltrados = alunosFiltrados.filter(aluno => 
        containsTextNormalized(aluno.nome, termoBusca) ||
        containsTextNormalized(aluno.matricula, termoBusca) ||
        (aluno.email && containsTextNormalized(aluno.email, termoBusca)) ||
        (aluno.tipo && containsTextNormalized(TIPOS_ALUNO_LABELS[aluno.tipo] || '', termoBusca)) ||
        containsTextNormalized(aluno.turma, termoBusca)
      );
    }

    // 4. Ordenar
    if (sortConfig.key) {
      alunosFiltrados.sort((a, b) => {
        // Tratamento especial para boolean (ativo)
        if (sortConfig.key === 'ativo') {
           const valA = a.ativo ? 1 : 0;
           const valB = b.ativo ? 1 : 0;
           if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
           return 0;
        }
        
        // Tratamento para tipo de aluno usando labels
        if (sortConfig.key === 'tipo' && a.tipo && b.tipo) {
            const labelA = TIPOS_ALUNO_LABELS[a.tipo] || '';
            const labelB = TIPOS_ALUNO_LABELS[b.tipo] || '';
            return labelA.localeCompare(labelB) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }

        // Tratamento geral para strings (nome, matricula, email, turma)
        const valA = a[sortConfig.key as keyof Aluno] ?? ''; // Fallback para string vazia se undefined/null
        const valB = b[sortConfig.key as keyof Aluno] ?? '';

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        
        // Fallback simples (não deve acontecer com as chaves atuais)
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return alunosFiltrados;
  }, [alunos, filtroAtivo, turmaSelecionada, termoBusca, sortConfig]);

  // Calcular total de páginas e limitar registros para a página atual
  const totalPaginas = Math.ceil(alunosFiltradosOrdenados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const alunosPaginados = alunosFiltradosOrdenados.slice(indiceInicial, indiceInicial + itensPorPagina);

  // Função para navegar entre páginas
  const irParaPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaAtual(pagina);
  };

  // Função para solicitar ordenação
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />; // Ícone padrão
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary" /> : // Ícone Ascendente
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary transform rotate-180" />; // Ícone Descendente
  };

  // Criar novo aluno
  const handleCriarAluno = async (dados: AlunoFormData) => {
    try {
      const alunoId = await alunoService.criarOuAtualizarAluno(dados);
      toast({ title: 'Sucesso', description: `Aluno ${dados.nome} criado com sucesso.` });
      await logAction('CREATE', 'ALUNOS', `Aluno ${dados.nome} (${dados.matricula}) criado.`, { alunoId });
      setMostrarFormulario(false);
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao criar aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao criar aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao criar aluno ${dados.nome}`, { error: error?.message, dados });
      console.error(error);
    }
  };

  // Atualizar aluno
  const handleAtualizarAluno = async (dados: AlunoFormData) => {
    if (!alunoEmEdicao) return;
    const alunoId = alunoEmEdicao.id;
    
    try {
      await alunoService.atualizarAluno(alunoId, dados);
      toast({ title: 'Sucesso', description: `Aluno ${dados.nome} atualizado com sucesso.` });
      await logAction('UPDATE', 'ALUNOS', `Aluno ${dados.nome} (${dados.matricula}) atualizado.`, { alunoId, dados });
      setAlunoEmEdicao(null);
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao atualizar aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao atualizar aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao atualizar aluno ${dados.nome} (ID: ${alunoId})`, { error: error?.message, dados });
      console.error(error);
    }
  };

  // Excluir aluno
  const handleExcluirAluno = async (aluno: Aluno) => {
    if (!window.confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?`)) return;
    const { id: alunoId, nome, matricula } = aluno;
    
    try {
      await alunoService.excluirAluno(alunoId);
      toast({ title: 'Sucesso', description: `Aluno ${nome} excluído com sucesso.` });
      await logAction('DELETE', 'ALUNOS', `Aluno ${nome} (${matricula}) excluído.`, { alunoId });
      carregarAlunos();
    } catch (error: any) {
      setError('Erro ao excluir aluno');
      toast({ title: 'Erro', description: error?.message || 'Falha ao excluir aluno.', variant: 'destructive' });
      await logAction('ERROR', 'ALUNOS', `Falha ao excluir aluno ${nome} (ID: ${alunoId})`, { error: error?.message });
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  return (
    <ProtectedRoute allowedProfiles={['ADMIN', 'COORDENADOR', 'PROFESSOR']}>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciamento de Alunos</h1>
          <div className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/alunos/importar')}
            >
              Importar / Atualizar Alunos
            </Button>
            <Button variant="default" onClick={() => setMostrarFormulario(true)}>
              Novo Aluno
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Filtro de status */}
          <div className="flex items-center">
            <span className="mr-3 font-medium whitespace-nowrap">Filtrar por status:</span>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant={filtroAtivo === true ? "default" : "outline"}
                onClick={() => setFiltroAtivo(true)}
                className="px-3 py-1 h-auto"
              >
                Ativos
              </Button>
              <Button 
                size="sm"
                variant={filtroAtivo === false ? "default" : "outline"}
                onClick={() => setFiltroAtivo(false)}
                className="px-3 py-1 h-auto"
              >
                Inativos
              </Button>
              <Button 
                size="sm"
                variant={filtroAtivo === undefined ? "default" : "outline"}
                onClick={() => setFiltroAtivo(undefined)}
                className="px-3 py-1 h-auto"
              >
                Todos
              </Button>
            </div>
          </div>

          {/* Filtro de Turma */}
          <div className="w-full md:w-auto md:min-w-[200px]">
            <Select
              value={turmaSelecionada}
              onValueChange={(value) => {
                setTurmaSelecionada(value);
                setPaginaAtual(1); // Resetar para primeira página ao mudar o filtro
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Busca */}
          <div className="w-full md:w-auto md:max-w-xs">
            <Input 
              placeholder="Buscar por nome, matrícula, email..."
              value={termoBusca}
              onChange={(e) => {
                setTermoBusca(e.target.value);
                setPaginaAtual(1); // Resetar para primeira página ao mudar o filtro
              }}
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          {/* Exibir contagem de resultados */}
          Exibindo {alunosPaginados.length} de {alunosFiltradosOrdenados.length} alunos
          {filtroAtivo === true && ' (apenas ativos)'}
          {filtroAtivo === false && ' (apenas inativos)'}
          {turmaSelecionada !== 'all' && ` da turma ${turmaSelecionada}`}
          {termoBusca && ` filtrados por "${termoBusca}"`}
        </div>

        {(mostrarFormulario || alunoEmEdicao) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 className="text-xl font-bold mb-4">
                {alunoEmEdicao ? 'Editar Aluno' : 'Novo Aluno'}
              </h2>
              <AlunoForm
                aluno={alunoEmEdicao || undefined}
                onSubmit={alunoEmEdicao ? handleAtualizarAluno : handleCriarAluno}
                onCancel={() => {
                  setMostrarFormulario(false);
                  setAlunoEmEdicao(null);
                }}
                turmas={turmas}
              />
            </div>
          </div>
        )}

        {/* Tabela Principal */}
        <div className="rounded-md border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('nome')} className="px-0 hover:bg-transparent">
                    Nome {renderSortIcon('nome')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('matricula')} className="px-0 hover:bg-transparent">
                    Matrícula {renderSortIcon('matricula')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('email')} className="px-0 hover:bg-transparent">
                    Email {renderSortIcon('email')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('tipo')} className="px-0 hover:bg-transparent">
                    Tipo {renderSortIcon('tipo')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('turma')} className="px-0 hover:bg-transparent">
                    Turma {renderSortIcon('turma')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button variant="ghost" onClick={() => requestSort('ativo')} className="px-0 hover:bg-transparent">
                    Status {renderSortIcon('ativo')}
                  </Button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Mapear sobre a lista paginada */}
              {alunosPaginados.length > 0 ? (
                alunosPaginados.map((aluno: Aluno) => (
                  <tr key={aluno.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {aluno.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aluno.matricula}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aluno.email || '-'} {/* Mostrar '-' se não houver email */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Usar labels para exibir o tipo */}
                      {aluno.tipo ? TIPOS_ALUNO_LABELS[aluno.tipo] : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aluno.turma}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        aluno.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {aluno.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setAlunoEmEdicao(aluno)}
                      >
                        Editar
                      </Button>
                      {/* Manter o botão de excluir como estava, mas pode ser ajustado */}
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleExcluirAluno(aluno)}
                        disabled={!aluno.ativo} // Exemplo: Desabilitar exclusão se inativo
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                 <tr>
                   <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                     Nenhum aluno encontrado com os filtros aplicados.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {alunosFiltradosOrdenados.length > 0 && (
          <div className="flex flex-col items-center justify-between mt-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <select 
                value={itensPorPagina} 
                onChange={(e) => {
                  setItensPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="5">5 por página</option>
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
              </select>
              <span>
                Página {paginaAtual} de {totalPaginas}
              </span>
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => irParaPagina(paginaAtual - 1)} 
                    className={paginaAtual <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Gerar itens de paginação */}
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  // Lógica para mostrar páginas ao redor da página atual
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaAtual - 2 + i;
                  }
                  
                  return pageNum > 0 && pageNum <= totalPaginas ? (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        isActive={paginaAtual === pageNum}
                        onClick={() => irParaPagina(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ) : null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => irParaPagina(paginaAtual + 1)} 
                    className={paginaAtual >= totalPaginas ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}