import { db, auth } from '@/lib/firebase';
import { Refeicao, RefeicaoFilter, RefeicaoFormData } from '@/types/refeicao';
import { User } from 'firebase/auth';
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
    presente: data.presente ?? true,
    observacao: data.observacao,
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
    throw new Error('Usuário não autenticado');
  }

  try {
    // Força a atualização do usuário para ter os dados mais recentes
    await currentUser.reload();
    
    // Obtém o usuário atualizado
    const userAtualizado = auth.currentUser;
    
    if (!userAtualizado?.emailVerified) {
      throw new Error('Email não verificado. Por favor, verifique seu email para acessar as refeições.');
    }

    return userAtualizado;
  } catch (error) {
    console.error('Erro ao verificar permissões:', error instanceof Error ? error.message : JSON.stringify(error));
    throw new Error('Erro ao verificar permissões. Por favor, faça login novamente.');
  }
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
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const refeicaoService = {
  async listarRefeicoes(filtro?: RefeicaoFilter): Promise<Refeicao[]> {
    try {
      await verificarPermissoes();
      console.log('Iniciando listagem de refeições com filtro:', filtro);

      const refeicoesRef = collection(db, COLLECTION_NAME);
      let constraints: any[] = [];

      if (filtro) {
        if (filtro.dataInicio || filtro.dataFim) {
          const inicio = filtro.dataInicio ? new Date(filtro.dataInicio) : new Date(0);
          const fim = filtro.dataFim ? new Date(filtro.dataFim) : new Date();
          inicio.setHours(0, 0, 0, 0);
          fim.setHours(23, 59, 59, 999);

          constraints.push(where('data', '>=', Timestamp.fromDate(inicio)));
          constraints.push(where('data', '<=', Timestamp.fromDate(fim)));
        }

        if (filtro.alunoId) {
          constraints.push(where('alunoId', '==', filtro.alunoId));
        }

        if (filtro.presente !== undefined) {
          constraints.push(where('presente', '==', filtro.presente));
        }
      }

      // Adiciona ordenação por data
      constraints.push(orderBy('data', 'desc'));

      const q = query(refeicoesRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let refeicoes = querySnapshot.docs.map(converterParaRefeicao);

      // Aplicar filtros que não podem ser feitos no Firestore
      if (filtro) {
        if (filtro.turma) {
          refeicoes = refeicoes.filter(r => r.turma === filtro.turma);
        }
        if (filtro.tipo) {
          refeicoes = refeicoes.filter(r => r.tipo === filtro.tipo);
        }
      }

      console.log(`Encontradas ${refeicoes.length} refeições`);
      return refeicoes;
    } catch (error) {
      console.error('Erro ao listar refeições:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async buscarRefeicao(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Refeição não encontrada');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Refeicao;
    } catch (error) {
      console.error('Erro ao buscar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async registrarRefeicao(dados: RefeicaoFormData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...dados,
        data: Timestamp.fromDate(dados.data),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao registrar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async atualizarRefeicao(id: string, dados: Partial<RefeicaoFormData>) {
    try {
      await verificarPermissoes();

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...dados,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async excluirRefeicao(id: string) {
    try {
      await verificarPermissoes();
      
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir refeição:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },

  async buscarRefeicoesSemana(alunoId: string, data: Date = new Date()): Promise<Refeicao[]> {
    try {
      // Encontra o início da semana (domingo)
      const inicioSemana = new Date(data);
      inicioSemana.setDate(data.getDate() - data.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      // Encontra o fim da semana (sábado)
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      const refeicaoRef = collection(db, COLLECTION_NAME);
      const q = query(
        refeicaoRef,
        where('alunoId', '==', alunoId),
        where('data', '>=', inicioSemana),
        where('data', '<=', fimSemana),
        where('presente', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => converterParaRefeicao(doc));
    } catch (error) {
      console.error('Erro ao buscar refeições da semana:', error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  },
};
