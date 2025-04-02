import { db, auth } from '@/lib/firebase';
import { Refeicao, RefeicaoFilter, RefeicaoFormData, TipoRefeicao } from '@/types/refeicao';
import { User } from 'firebase/auth';
import { Aluno } from '@/types/aluno';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  setDoc,
  limit,
  writeBatch
} from 'firebase/firestore';
import { atividadeService } from '@/services/atividadeService';

const COLLECTION_NAME = 'refeicoes';

const converterParaRefeicao = (doc: DocumentData): Refeicao => {
  const data = doc.data();
  if (!data) {
    throw new Error('Documento sem dados');
  }

  return {
    id: doc.id,
    alunoId: data.alunoId,
    nomeAluno: data.nomeAluno,
    turma: data.turma,
    data: data.data?.toDate() || new Date(),
    tipo: data.tipo,
    presente: data.presente ?? false,
    observacao: data.observacao,
    isAvulso: data.isAvulso ?? false,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
};

const verificarPermissoes = async () => {
  // Aguarda a inicialização da autenticação
  const currentUser = await new Promise<User | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!currentUser) {
    console.warn('Usuário não autenticado ao tentar acessar refeições');
    throw new Error('Usuário não autenticado');
  }

  // Força a atualização do token para garantir que esteja válido
  try {
    await currentUser.getIdToken(true);
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    throw new Error('Falha na autenticação');
  }

  return currentUser;
};

const dadosTeste: Refeicao[] = [
  {
    id: '1',
    alunoId: '1',
    nomeAluno: 'Alice Cisternas Araujo',
    turma: '5º ano (MANHÃ)',
    data: new Date('2025-03-14T12:00:00'),
    tipo: 'ALMOCO',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    alunoId: '1',
    nomeAluno: 'Alice Cisternas Araujo',
    turma: '5º ano (MANHÃ)',
    data: new Date('2025-03-14T09:30:00'),
    tipo: 'LANCHE_MANHA',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    alunoId: '2',
    nomeAluno: 'Bruno Santos Silva',
    turma: '5º ano (MANHÃ)',
    data: new Date('2025-03-14T12:00:00'),
    tipo: 'ALMOCO',
    presente: false,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    alunoId: '3',
    nomeAluno: 'Carolina Oliveira Lima',
    turma: '4º ano (TARDE)',
    data: new Date('2025-03-14T15:30:00'),
    tipo: 'LANCHE_TARDE',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    alunoId: '1',
    nomeAluno: 'Alice Cisternas Araujo',
    turma: '5º ano (MANHÃ)',
    data: new Date('2025-03-13T12:00:00'),
    tipo: 'ALMOCO',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    alunoId: '4',
    nomeAluno: 'Daniel Pereira Costa',
    turma: '3º ano (MANHÃ)',
    data: new Date('2025-03-14T09:30:00'),
    tipo: 'LANCHE_MANHA',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    alunoId: '5',
    nomeAluno: 'Elena Martins Rocha',
    turma: '4º ano (TARDE)',
    data: new Date('2025-03-14T12:00:00'),
    tipo: 'ALMOCO',
    presente: true,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    alunoId: '5',
    nomeAluno: 'Elena Martins Rocha',
    turma: '4º ano (TARDE)',
    data: new Date('2025-03-13T15:30:00'),
    tipo: 'LANCHE_TARDE',
    presente: false,
    isAvulso: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// --- Funções Auxiliares ---

// Retorna o limite semanal de refeições para um tipo de plano
function getLimiteSemanal(tipoAluno: Aluno['tipo']): number | null {
  switch (tipoAluno) {
    case 'INTEGRAL_5X': return 5;
    case 'INTEGRAL_4X': return 4;
    case 'INTEGRAL_3X': return 3;
    case 'INTEGRAL_2X': return 2;
    case 'MENSALISTA': return null; // Sem limite
    case 'AVULSO': return null; // Sem limite (mas toda refeição será avulsa por natureza)
    default: return null;
  }
}

// Retorna o início (domingo 00:00) e fim (sábado 23:59) da semana para uma data
function getLimitesSemana(dataRefeicao: Date): { inicioSemana: Timestamp; fimSemana: Timestamp } {
  const data = new Date(dataRefeicao);
  const diaDaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // Calcular início da semana (Domingo)
  const inicioSemana = new Date(data);
  inicioSemana.setDate(data.getDate() - diaDaSemana);
  inicioSemana.setHours(0, 0, 0, 0);

  // Calcular fim da semana (Sábado)
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  return {
    inicioSemana: Timestamp.fromDate(inicioSemana),
    fimSemana: Timestamp.fromDate(fimSemana),
  };
}

// --- Fim Funções Auxiliares ---

export const refeicaoService = {
  async listarRefeicoes(filtro?: RefeicaoFilter): Promise<Refeicao[]> {
    try {
      await verificarPermissoes();
      console.log('Iniciando listagem de refeições com filtro:', filtro);

      const refeicoesRef = collection(db, COLLECTION_NAME);
      let constraints: any[] = [];

      // Filtro principal no Firestore (ex: por alunoId ou intervalo de data amplo)
      if (filtro?.alunoId) {
        constraints.push(where('alunoId', '==', filtro.alunoId));
      } else if (filtro?.dataInicio) {
        const inicio = new Date(filtro.dataInicio);
        inicio.setHours(0, 0, 0, 0);
        constraints.push(where('data', '>=', Timestamp.fromDate(inicio)));
      } else if (filtro?.dataFim) {
        const fim = new Date(filtro.dataFim);
        fim.setHours(23, 59, 59, 999);
        constraints.push(where('data', '<=', Timestamp.fromDate(fim)));
      } // Adicionar mais otimizações de query se necessário

      const q = query(refeicoesRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let refeicoes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          alunoId: data.alunoId,
          nomeAluno: data.nomeAluno,
          turma: data.turma,
          data: data.data?.toDate() || new Date(),
          tipo: data.tipo,
          presente: data.presente ?? false,
          observacao: data.observacao,
          isAvulso: data.isAvulso ?? false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Refeicao;
      });

      // Aplicar filtros restantes no cliente
      if (filtro) {
        // Filtro de intervalo de data mais preciso
        if (filtro.dataInicio || filtro.dataFim) {
          const inicioFiltro = filtro.dataInicio ? new Date(filtro.dataInicio).setHours(0,0,0,0) : -Infinity;
          const fimFiltro = filtro.dataFim ? new Date(filtro.dataFim).setHours(23,59,59,999) : Infinity;
          refeicoes = refeicoes.filter(r => {
            const time = r.data.getTime();
            return time >= inicioFiltro && time <= fimFiltro;
          });
        }
        // Outros filtros
        if (filtro.turma) {
          refeicoes = refeicoes.filter(r => r.turma === filtro.turma);
        }
        if (filtro.tipo) {
          refeicoes = refeicoes.filter(r => r.tipo === filtro.tipo);
        }
        if (filtro.alunoId && !constraints.some(c => c._field === 'alunoId')) { // Aplicar se não foi filtro principal
          refeicoes = refeicoes.filter(r => r.alunoId === filtro.alunoId);
        }
        if (filtro.presente !== undefined) {
          refeicoes = refeicoes.filter(r => r.presente === filtro.presente);
        }
      }

      // Ordenação por data no cliente
      refeicoes.sort((a, b) => b.data.getTime() - a.data.getTime());

      console.log(`Encontradas ${refeicoes.length} refeições após filtros do cliente`);
      return refeicoes;
    } catch (error) {
      console.error('Erro ao listar refeições:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async buscarRefeicao(id: string): Promise<Refeicao> {
    try {
      await verificarPermissoes();
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Refeição não encontrada');
      }

      return converterParaRefeicao(docSnap);
    } catch (error) {
      console.error('Erro ao buscar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async registrarRefeicao(dados: RefeicaoFormData): Promise<string> {
    try {
      const user = await verificarPermissoes();
      console.log('[registrarRefeicao] Iniciando registro para:', dados);

      // 1. Buscar dados do aluno
      const alunoRef = doc(db, 'alunos', dados.alunoId);
      const alunoSnap = await getDoc(alunoRef);
      if (!alunoSnap.exists()) {
        throw new Error(`Aluno com ID ${dados.alunoId} não encontrado.`);
      }
      const alunoData = alunoSnap.data() as Aluno;
      console.log('[registrarRefeicao] Dados do aluno:', alunoData);

      // Validar se aluno está ativo
      if (!alunoData.ativo) {
        throw new Error(`Aluno ${alunoData.nome} está inativo e não pode registrar refeições.`);
      }

      let isAvulso = false;
      const dataRefeicao = dados.data instanceof Date ? dados.data : new Date();
      const diaSemanaRefeicao = dataRefeicao.getDay(); // 0 = Dom, 1 = Seg, ...
      const tipoAluno = alunoData.tipo;
      const diasPermitidos = alunoData.diasRefeicaoPermitidos || [];

      // 2. Verificar se é AVULSO por natureza
      if (tipoAluno === 'AVULSO') {
        isAvulso = true;
        console.log('[registrarRefeicao] Marcado como avulso (tipo AVULSO).');
      }
      
      // 3. Verificar se o DIA é permitido (para tipos INTEGRAL_XX)
      const limiteDias = getLimiteSemanal(tipoAluno);
      if (!isAvulso && limiteDias !== null) { // Apenas para tipos com limite de dias
        if (!diasPermitidos.includes(diaSemanaRefeicao)) {
          isAvulso = true;
          console.log(`[registrarRefeicao] Marcado como avulso (dia ${diaSemanaRefeicao} não permitido para ${tipoAluno}). Dias permitidos: ${diasPermitidos.join(',')}`);
        }
      }

      // 4. Verificar LIMITE SEMANAL (se ainda não for avulso e tiver limite)
      if (!isAvulso && limiteDias !== null) {
        const { inicioSemana, fimSemana } = getLimitesSemana(dataRefeicao);
        
        // Buscar refeições NÃO AVULSAS do MESMO TIPO na semana atual
        const refeicoesSemanaQuery = query(
          collection(db, COLLECTION_NAME),
          where('alunoId', '==', dados.alunoId),
          where('tipo', '==', dados.tipo),
          where('data', '>=', inicioSemana),
          where('data', '<=', fimSemana),
          where('isAvulso', '==', false) // Contar apenas as não avulsas
        );
        
        const refeicoesSemanaSnap = await getDocs(refeicoesSemanaQuery);
        const countRefeicoesSemana = refeicoesSemanaSnap.size;
        console.log(`[registrarRefeicao] Refeições não avulsas de ${dados.tipo} na semana: ${countRefeicoesSemana}. Limite: ${limiteDias}`);

        if (countRefeicoesSemana >= limiteDias) {
          isAvulso = true;
          console.log(`[registrarRefeicao] Marcado como avulso (limite semanal de ${limiteDias} para ${dados.tipo} atingido).`);
        }
      }

      // 5. Preparar dados para salvar
      const dadosParaSalvar = {
        ...dados,
        data: Timestamp.fromDate(dataRefeicao),
        isAvulso: isAvulso,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        registradoPor: user.uid,
        registradoPorEmail: user.email
      };

      // 6. Salvar no Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), dadosParaSalvar);
      console.log('[registrarRefeicao] Refeição registrada com ID:', docRef.id, 'isAvulso:', isAvulso);

      // 7. Registrar Atividade com campo 'detalhes'
      await atividadeService.registrarAtividade({
        usuarioId: user.uid,
        tipo: 'REFEICAO',
        descricao: `Refeição (${dados.tipo}) registrada para ${dados.nomeAluno} (Avulso: ${isAvulso})`,
        detalhes: { alunoId: dados.alunoId, refeicaoId: docRef.id, tipoRefeicao: dados.tipo, foiAvulso: isAvulso },
        usuarioEmail: user.email || '',
        entidadeId: docRef.id,
        entidadeTipo: 'refeicao'
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao registrar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async atualizarRefeicao(id: string, dados: Partial<RefeicaoFormData>): Promise<void> {
    try {
      const user = await verificarPermissoes();
      const docRef = doc(db, COLLECTION_NAME, id);

      // ATENÇÃO: Se a DATA ou TIPO da refeição for alterada, a lógica de 'isAvulso'
      // precisaria ser RECALCULADA aqui, similar ao registrarRefeicao.
      // Por simplicidade, esta versão não recalcula isAvulso na atualização.
      // Se for necessário, adicionar a lógica de recálculo aqui.

      const dadosParaAtualizar: any = { ...dados };

      // Converter Date para Timestamp se presente
      if (dados.data && dados.data instanceof Date) {
        dadosParaAtualizar.data = Timestamp.fromDate(dados.data);
      }
      // Remover campos indefinidos para não sobrescrever com undefined
      Object.keys(dadosParaAtualizar).forEach(key => 
        dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]
      );
      
      dadosParaAtualizar.updatedAt = Timestamp.now();
      dadosParaAtualizar.atualizadoPor = user.uid;
      dadosParaAtualizar.atualizadoPorEmail = user.email;

      await updateDoc(docRef, dadosParaAtualizar);
      console.log(`[atualizarRefeicao] Refeição ${id} atualizada.`);

      // Registrar Atividade com campo 'detalhes'
      await atividadeService.registrarAtividade({
        usuarioId: user.uid,
        tipo: 'REFEICAO',
        descricao: `Refeição ID ${id} atualizada.`,
        detalhes: { refeicaoId: id, dadosAtualizados: Object.keys(dados) },
        usuarioEmail: user.email || '',
        entidadeId: id,
        entidadeTipo: 'refeicao'
      });

    } catch (error) {
      console.error('Erro ao atualizar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async excluirRefeicao(id: string): Promise<void> {
    try {
      const user = await verificarPermissoes();
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Opcional: Buscar nome do aluno antes de deletar para log
      const refeicao = await this.buscarRefeicao(id);

      await deleteDoc(docRef);
      console.log(`[excluirRefeicao] Refeição ${id} excluída.`);

      // Registrar Atividade com campo 'detalhes'
      await atividadeService.registrarAtividade({
        usuarioId: user.uid,
        tipo: 'REFEICAO',
        descricao: `Refeição de ${refeicao.nomeAluno} (ID: ${id}) excluída.`,
        detalhes: { refeicaoId: id, alunoId: refeicao.alunoId, tipoRefeicao: refeicao.tipo },
        usuarioEmail: user.email || '',
        entidadeId: id,
        entidadeTipo: 'refeicao'
      });

    } catch (error) {
      console.error('Erro ao excluir refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async buscarRefeicoesSemana(alunoId: string, data: Date = new Date()): Promise<Refeicao[]> {
    try {
      await verificarPermissoes();
      const { inicioSemana, fimSemana } = getLimitesSemana(data);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('alunoId', '==', alunoId),
        where('data', '>=', inicioSemana),
        where('data', '<=', fimSemana),
        orderBy('data', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const refeicoes = querySnapshot.docs.map(converterParaRefeicao);
      console.log(`[buscarRefeicoesSemana] Encontradas ${refeicoes.length} refeições para ${alunoId} na semana de ${data.toLocaleDateString()}`);
      return refeicoes;
    } catch (error) {
      console.error('Erro ao buscar refeições da semana:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },
};
