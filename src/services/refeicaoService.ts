import { db, auth } from '@/lib/firebase';
import { Refeicao, RefeicaoFilter, RefeicaoFormData, TipoRefeicao } from '@/types/refeicao';
import { User } from 'firebase/auth';
import { Aluno, AlunoTipo } from '@/types/aluno';
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
    tipoConsumo: data.tipoConsumo || data.tipo,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
};

const verificarPermissoes = async (idToken?: string) => {
  if (!idToken) {
    console.warn('Token não fornecido para verificarPermissoes');
    throw new Error('Token de autenticação não fornecido');
  }

  console.log('verificarPermissoes chamada com token.');
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
    tipoConsumo: 'MENSALISTA',
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
    tipoConsumo: 'MENSALISTA',
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
    tipoConsumo: 'AVULSO',
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
    tipoConsumo: 'INTEGRAL_5X',
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
    tipoConsumo: 'MENSALISTA',
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
    tipoConsumo: 'INTEGRAL_3X',
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
    tipoConsumo: 'INTEGRAL_5X',
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
    tipoConsumo: 'INTEGRAL_5X',
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
      const currentUser = await auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      await currentUser.getIdToken(true);

      console.log('Iniciando listagem de refeições com filtro:', filtro);

      const refeicoesRef = collection(db, COLLECTION_NAME);
      let constraints: any[] = [];

      // Filtros principais no Firestore
      if (filtro?.alunoId) {
        constraints.push(where('alunoId', '==', filtro.alunoId));
      } 
      // Filtro de Data (obrigatório para filtrar tipoConsumo eficientemente)
      const inicio = filtro?.dataInicio ? new Date(filtro.dataInicio) : new Date();
      inicio.setHours(0, 0, 0, 0);
      constraints.push(where('data', '>=', Timestamp.fromDate(inicio)));

      const fim = filtro?.dataFim ? new Date(filtro.dataFim) : new Date();
      fim.setHours(23, 59, 59, 999);
      constraints.push(where('data', '<=', Timestamp.fromDate(fim)));
      
      // NOVO: Adicionar filtro por tipoConsumo se fornecido
      if (filtro?.tipoConsumo) {
        constraints.push(where('tipoConsumo', '==', filtro.tipoConsumo));
        console.log(`Adicionando filtro Firestore: tipoConsumo == ${filtro.tipoConsumo}`);
      }

      // Adicionar ordenação padrão por data descendente
      constraints.push(orderBy('data', 'desc'));

      const q = query(refeicoesRef, ...constraints);
      const querySnapshot = await getDocs(q);
      console.log(`Consulta Firestore retornou ${querySnapshot.size} documentos.`);
      
      // Mapeamento já deve usar tipoConsumo (da edição anterior)
      let refeicoes = querySnapshot.docs.map(converterParaRefeicao);

      // Aplicar filtros restantes no cliente (menos necessários agora)
      if (filtro) {
         // Filtro por turma (se ainda necessário)
        if (filtro.turma) {
          refeicoes = refeicoes.filter(r => r.turma === filtro.turma);
        }
        // Filtro por tipo de REFEIÇÃO (Lanche, Almoço) - diferente de tipoConsumo
        if (filtro.tipo) {
          refeicoes = refeicoes.filter(r => r.tipo === filtro.tipo);
        }
         // Filtro de presença
        if (filtro.presente !== undefined) {
          refeicoes = refeicoes.filter(r => r.presente === filtro.presente);
        }
      }

      console.log(`Encontradas ${refeicoes.length} refeições após filtros finais.`);
      return refeicoes;
    } catch (error: any) {
      // Verificar se é erro de índice faltando
      if (error.code === 'failed-precondition') {
         console.error('Erro de pré-condição Firestore: Provavelmente falta um índice composto.', error);
         // Tentar extrair URL do índice da mensagem de erro
         const urlMatch = error.message.match(/(https?:\/\/[^\s]+)/);
         const urlIndice = urlMatch ? urlMatch[0] : 'Verifique o Console do Firebase';
         throw new Error(`Consulta requer um índice no Firestore. Crie-o aqui: ${urlIndice}`);
      }
      console.error('Erro em listarRefeicoes:', error);
      throw error;
    }
  },

  async buscarRefeicao(id: string): Promise<Refeicao> {
    try {
      const currentUser = await auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      await currentUser.getIdToken(true);

      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Refeição não encontrada');
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        alunoId: data.alunoId,
        nomeAluno: data.nomeAluno,
        turma: data.turma,
        data: data.data?.toDate() || new Date(),
        tipo: data.tipo,
        presente: data.presente ?? false,
        observacao: data.observacao,
        tipoConsumo: data.tipoConsumo || data.tipo,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Refeicao;
    } catch (error: any) {
       console.error(`Erro ao buscar refeição ${id}:`, error);
       throw error;
    }
  },

  async registrarRefeicao(dados: RefeicaoFormData): Promise<string> {
    const currentUser = await auth.currentUser;
    if (!currentUser) throw new Error('Usuário não autenticado');
    await currentUser.getIdToken(true);

    console.log('Registrando refeição com dados recebidos:', dados);

    // Validação básica (pode adicionar mais se necessário)
    if (!dados.alunoId || !dados.nomeAluno || !dados.turma || !dados.tipo || !dados.tipoConsumo) {
       throw new Error('Dados incompletos para registrar refeição.');
    }

    // --- INÍCIO DA VERIFICAÇÃO DE DUPLICIDADE ---
    try {
      const dataRefeicao = new Date(dados.data);
      const inicioDoDia = new Date(dataRefeicao);
      inicioDoDia.setHours(0, 0, 0, 0);
      const fimDoDia = new Date(dataRefeicao);
      fimDoDia.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('alunoId', '==', dados.alunoId),
        where('tipo', '==', dados.tipo),
        where('data', '>=', Timestamp.fromDate(inicioDoDia)),
        where('data', '<=', Timestamp.fromDate(fimDoDia)),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.warn(`Tentativa de registro duplicado: Aluno ${dados.alunoId}, Refeição ${dados.tipo}, Data ${dataRefeicao.toLocaleDateString()}`);
        throw new Error(`Este aluno (${dados.nomeAluno}) já realizou esta refeição (${dados.tipo}) hoje.`);
      }
    } catch (error) {
      // Se o erro for o que lançamos, repassa ele.
      // Se for outro erro da consulta, loga e lança.
      if (error instanceof Error && error.message.includes('já realizou esta refeição')) {
         throw error;
      }
      console.error("Erro ao verificar duplicidade de refeição:", error);
      // Considerar lançar um erro mais genérico ou o erro original?
      throw new Error('Falha ao verificar refeição existente.'); 
    }
    // --- FIM DA VERIFICAÇÃO DE DUPLICIDADE ---

    const novaRefeicao = {
      alunoId: dados.alunoId,
      nomeAluno: dados.nomeAluno,
      turma: dados.turma,
      data: Timestamp.fromDate(new Date(dados.data)), // Garantir que é Timestamp
      tipo: dados.tipo, // Tipo da refeicao (Lanche, Almoço)
      presente: dados.presente ?? true,
      observacao: dados.observacao || '',
      tipoConsumo: dados.tipoConsumo, // <<< USA O TIPO RECEBIDO
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), novaRefeicao);
      await atividadeService.registrarAtividade({
        tipo: 'REFEICAO',
        entidadeTipo: 'REFEICOES',
        descricao: `Refeição (${novaRefeicao.tipo}) registrada como ${novaRefeicao.tipoConsumo} para ${novaRefeicao.nomeAluno}`,
        entidadeId: docRef.id,
        detalhes: { refeicaoId: docRef.id, alunoId: novaRefeicao.alunoId, tipoConsumo: novaRefeicao.tipoConsumo },
        usuarioId: currentUser.uid,
        usuarioEmail: currentUser.email || 'email-desconhecido'
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro detalhado ao adicionar refeição:", error);
      await atividadeService.registrarAtividade({
        tipo: 'REFEICAO',
        entidadeTipo: 'REFEICOES',
        descricao: `Falha ao registrar Refeição (${novaRefeicao.tipo}) como ${novaRefeicao.tipoConsumo} para ${novaRefeicao.nomeAluno}`,
        detalhes: { erro: (error as Error).message, dadosTentativa: novaRefeicao },
        usuarioId: currentUser.uid,
        usuarioEmail: currentUser.email || 'email-desconhecido'
      });
      throw new Error(`Falha ao registrar refeição: ${(error as Error).message}`);
    }
  },

  async atualizarRefeicao(id: string, dados: Partial<RefeicaoFormData>): Promise<void> {
    try {
      const currentUser = await auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      const idToken = await currentUser.getIdToken(true);

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
      dadosParaAtualizar.atualizadoPor = currentUser.uid;
      dadosParaAtualizar.atualizadoPorEmail = currentUser.email;

      await updateDoc(docRef, dadosParaAtualizar);
      console.log(`[atualizarRefeicao] Refeição ${id} atualizada.`);

      // Registrar Atividade com campo 'detalhes'
      await atividadeService.registrarAtividade({
        usuarioId: currentUser.uid,
        tipo: 'REFEICAO',
        descricao: `Refeição ID ${id} atualizada.`,
        detalhes: { refeicaoId: id, dadosAtualizados: Object.keys(dados) },
        usuarioEmail: currentUser.email || '',
        entidadeId: id,
        entidadeTipo: 'refeicao'
      });

    } catch (error: any) {
      console.error(`Erro ao atualizar refeição ${id}:`, error);
      throw error;
    }
  },

  async excluirRefeicao(id: string): Promise<void> {
    try {
      const currentUser = await auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      const idToken = await currentUser.getIdToken(true);

      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Opcional: Buscar nome do aluno antes de deletar para log
      const refeicao = await this.buscarRefeicao(id);

      await deleteDoc(docRef);
      console.log(`[excluirRefeicao] Refeição ${id} excluída.`);

      // Registrar Atividade com campo 'detalhes'
      await atividadeService.registrarAtividade({
        usuarioId: currentUser.uid,
        tipo: 'REFEICAO',
        descricao: `Refeição de ${refeicao.nomeAluno} (ID: ${id}) excluída.`,
        detalhes: { refeicaoId: id, alunoId: refeicao.alunoId, tipoRefeicao: refeicao.tipo },
        usuarioEmail: currentUser.email || '',
        entidadeId: id,
        entidadeTipo: 'refeicao'
      });

    } catch (error: any) {
      console.error(`Erro ao excluir refeição ${id}:`, error);
      throw error;
    }
  },

  async buscarRefeicoesSemana(alunoId: string, data: Date = new Date(), idToken: string): Promise<Refeicao[]> {
    //await verificarPermissoes(idToken); // Descomentar se a verificação for necessária aqui
    console.log(`buscarRefeicoesSemana para aluno ${alunoId} na data ${data.toISOString()}`);
    
    const { inicioSemana, fimSemana } = getLimitesSemana(data);

    const q = query(
      collection(db, COLLECTION_NAME),
      where('alunoId', '==', alunoId),
      where('data', '>=', inicioSemana),
      where('data', '<=', fimSemana),
      // ATENÇÃO: Filtrar pelo tipo de consumo para contar corretamente?
      // Depende se queremos contar refeições avulsas para o limite ou não.
      // Se NÃO contamos avulsas: where('tipoConsumo', '!=', 'AVULSO'),
      orderBy('data', 'desc')
    );

    try {
      const querySnapshot = await getDocs(q);
      const refeicoes = querySnapshot.docs.map(converterParaRefeicao);
      console.log(`Encontradas ${refeicoes.length} refeições na semana para ${alunoId}`);
      return refeicoes;
    } catch (error) {
      console.error(`Erro ao buscar refeições da semana para ${alunoId}:`, error);
      throw error; // Propagar o erro
    }
  },
};
