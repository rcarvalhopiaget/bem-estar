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
    console.error('Erro ao verificar permissões:', error);
    throw new Error('Erro ao verificar permissões. Por favor, faça login novamente.');
  }
};

export const refeicaoService = {
  async listarRefeicoes(filtros?: RefeicaoFilter) {
    try {
      await verificarPermissoes();

      // Cria a query base
      let q = query(collection(db, COLLECTION_NAME));

      // Aplica os filtros
      if (filtros?.dataInicio) {
        q = query(q, where('data', '>=', Timestamp.fromDate(filtros.dataInicio)));
      }
      if (filtros?.dataFim) {
        q = query(q, where('data', '<=', Timestamp.fromDate(filtros.dataFim)));
      }
      if (filtros?.tipo) {
        q = query(q, where('tipo', '==', filtros.tipo));
      }
      if (filtros?.turma) {
        q = query(q, where('turma', '==', filtros.turma));
      }
      if (filtros?.alunoId) {
        q = query(q, where('alunoId', '==', filtros.alunoId));
      }
      if (filtros?.presente !== undefined) {
        q = query(q, where('presente', '==', filtros.presente));
      }

      // Ordena por data
      q = query(q, orderBy('data', 'desc'));
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      return querySnapshot.docs.map(converterParaRefeicao);
    } catch (error) {
      console.error('Erro ao listar refeições:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Você não tem permissão para acessar as refeições. Verifique seu email para obter acesso completo.');
        }
        throw error;
      }
      throw new Error('Erro ao listar refeições. Por favor, tente novamente.');
    }
  },

  async buscarRefeicao(id: string) {
    try {
      await verificarPermissoes();
      
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Refeição não encontrada');
      }

      return converterParaRefeicao(docSnap);
    } catch (error) {
      console.error('Erro ao buscar refeição:', error);
      throw error;
    }
  },

  async registrarRefeicao(dados: RefeicaoFormData) {
    try {
      await verificarPermissoes();

      // Verifica se já existe uma refeição para o mesmo dia e tipo
      const q = query(
        collection(db, COLLECTION_NAME),
        where('data', '==', Timestamp.fromDate(dados.data)),
        where('tipo', '==', dados.tipo)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Se encontrar uma refeição existente, atualiza ela
        const docRef = querySnapshot.docs[0].ref;
        const now = new Date();
        const docData = {
          ...dados,
          updatedAt: Timestamp.fromDate(now)
        };

        await updateDoc(docRef, docData);
        return docRef.id;
      }

      // Se não encontrar, cria uma nova refeição
      const now = new Date();
      const docData = {
        ...dados,
        data: Timestamp.fromDate(dados.data),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao registrar refeição:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Você não tem permissão para registrar refeições. Verifique seu email para obter acesso completo.');
        } else if (error.message.includes('Document already exists')) {
          throw new Error('Já existe uma refeição registrada para este dia e tipo.');
        }
      }
      throw new Error('Erro ao registrar refeição. Por favor, tente novamente.');
    }
  },

  async atualizarRefeicao(id: string, dados: Partial<RefeicaoFormData>) {
    try {
      await verificarPermissoes();

      const docRef = doc(db, COLLECTION_NAME, id);
      const docData = {
        ...dados,
        data: dados.data ? Timestamp.fromDate(dados.data) : undefined,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(docRef, docData);
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error);
      if (error instanceof Error && error.message.includes('permission-denied')) {
        throw new Error('Você não tem permissão para atualizar refeições. Verifique seu email para obter acesso completo.');
      }
      throw error;
    }
  },

  async excluirRefeicao(id: string) {
    try {
      await verificarPermissoes();
      
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir refeição:', error);
      if (error instanceof Error && error.message.includes('permission-denied')) {
        throw new Error('Você não tem permissão para excluir refeições. Verifique seu email para obter acesso completo.');
      }
      throw error;
    }
  }
};
