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
import { ArrowUpDown } from "lucide-react";

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
  INTEGRAL_5X: 'Integral 5x',
  INTEGRAL_4X: 'Integral 4x',
  INTEGRAL_3X: 'Integral 3x',
  INTEGRAL_2X: 'Integral 2x',
  MENSALISTA: 'Mensalista',
  SEMI_INTEGRAL: 'Semi Integral',
  ESTENDIDO: 'Estendido',
};

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<Aluno | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(true); // Inicialmente mostra apenas ativos
  const [termoBusca, setTermoBusca] = useState(''); // Estado para busca
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nome', direction: 'ascending' }); // Estado para ordenação
  const { logAction } = useLogService();
  const { toast } = useToast();
  const router = useRouter();

  // Carregar lista de alunos
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

  useEffect(() => {
    carregarAlunos();
    // Remover dependencia do filtroAtivo, pois ele será aplicado no frontend
  }, []);

  // Lógica de filtragem e ordenação usando useMemo
  const alunosFiltradosOrdenados = useMemo(() => {
    let alunosFiltrados = [...alunos];

    // 1. Filtrar por status (ativo/inativo/todos)
    if (filtroAtivo !== undefined) {
      alunosFiltrados = alunosFiltrados.filter(aluno => aluno.ativo === filtroAtivo);
    }

    // 2. Filtrar por termo de busca
    if (termoBusca) {
      const buscaLower = termoBusca.toLowerCase();
      alunosFiltrados = alunosFiltrados.filter(aluno => 
        aluno.nome.toLowerCase().includes(buscaLower) ||
        aluno.matricula.toLowerCase().includes(buscaLower) ||
        (aluno.email && aluno.email.toLowerCase().includes(buscaLower)) ||
        (aluno.tipo && TIPOS_ALUNO_LABELS[aluno.tipo]?.toLowerCase().includes(buscaLower)) ||
        aluno.turma.toLowerCase().includes(buscaLower)
      );
    }

    // 3. Ordenar
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
  }, [alunos, filtroAtivo, termoBusca, sortConfig]);

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
          {/* Campo de Busca */}
          <div className="w-full md:w-auto md:max-w-xs">
            <Input 
              placeholder="Buscar por nome, matrícula, email, tipo ou turma..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          {/* Exibir contagem de resultados */}
          Exibindo {alunosFiltradosOrdenados.length} de {alunos.length} alunos
          {filtroAtivo === true && ' (apenas ativos)'}
          {filtroAtivo === false && ' (apenas inativos)'}
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
              {/* Mapear sobre a lista filtrada e ordenada */}
              {alunosFiltradosOrdenados.length > 0 ? (
                alunosFiltradosOrdenados.map((aluno: Aluno) => (
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
      </div>
    </ProtectedRoute>
  );
}