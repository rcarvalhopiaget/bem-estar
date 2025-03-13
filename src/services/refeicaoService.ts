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

const dadosTeste: Refeicao[] = [
  {
    id: '1',
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
    id: '2',
    alunoId: '1',
    nomeAluno: 'Alice Cisternas Araujo',
    turma: '5º ano (MANHÃ)',
    data: new Date('2025-03-13T09:30:00'),
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
    data: new Date('2025-03-13T12:00:00'),
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
    data: new Date('2025-03-13T15:30:00'),
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
    data: new Date('2025-03-12T12:00:00'),
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
    data: new Date('2025-03-13T09:30:00'),
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
    data: new Date('2025-03-13T12:00:00'),
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
    data: new Date('2025-03-12T15:30:00'),
    tipo: 'LANCHE_TARDE',
    presente: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const refeicaoService = {
  async listarRefeicoes(filtro?: RefeicaoFilter): Promise<Refeicao[]> {
    // Simula um pequeno delay para parecer uma chamada real
    await new Promise(resolve => setTimeout(resolve, 500));

    let refeicoes = [...dadosTeste];

    if (filtro) {
      if (filtro.data) {
        const dataFiltro = new Date(filtro.data);
        refeicoes = refeicoes.filter(r => 
          r.data.getFullYear() === dataFiltro.getFullYear() &&
          r.data.getMonth() === dataFiltro.getMonth() &&
          r.data.getDate() === dataFiltro.getDate()
        );
      }

      if (filtro.dataInicio) {
        refeicoes = refeicoes.filter(r => r.data >= filtro.dataInicio!);
      }

      if (filtro.dataFim) {
        refeicoes = refeicoes.filter(r => r.data <= filtro.dataFim!);
      }

      if (filtro.turma) {
        refeicoes = refeicoes.filter(r => r.turma === filtro.turma);
      }

      if (filtro.tipo) {
        refeicoes = refeicoes.filter(r => r.tipo === filtro.tipo);
      }

      if (filtro.alunoId) {
        refeicoes = refeicoes.filter(r => r.alunoId === filtro.alunoId);
      }

      if (filtro.presente !== undefined) {
        refeicoes = refeicoes.filter(r => r.presente === filtro.presente);
      }
    }

    return refeicoes;
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

  async registrarRefeicao(dados: RefeicaoFormData): Promise<Refeicao> {
    const novaRefeicao: Refeicao = {
      id: Math.random().toString(36).substr(2, 9),
      ...dados,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    dadosTeste.push(novaRefeicao);
    return novaRefeicao;
  },

  async atualizarRefeicao(id: string, dados: Partial<RefeicaoFormData>): Promise<void> {
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

  async excluirRefeicao(id: string): Promise<void> {
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
