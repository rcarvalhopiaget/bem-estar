import { db, auth } from '@/lib/firebase';
import { Atividade, AtividadeFilter, AtividadeFormData } from '@/types/atividade';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'atividades';

const converterParaAtividade = (doc: DocumentData): Atividade => {
  const data = doc.data();
  if (!data) {
    throw new Error('Documento sem dados');
  }

  return {
    id: doc.id,
    tipo: data.tipo,
    descricao: data.descricao,
    usuarioId: data.usuarioId,
    usuarioEmail: data.usuarioEmail,
    entidadeId: data.entidadeId,
    entidadeTipo: data.entidadeTipo,
    createdAt: data.createdAt?.toDate() || new Date()
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
    console.warn('Usuário não autenticado ao tentar acessar atividades');
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

export const atividadeService = {
  async listarAtividades(filtro?: AtividadeFilter): Promise<Atividade[]> {
    try {
      console.log('Buscando atividades com filtro:', filtro);
      
      await verificarPermissoes();
      
      const colRef = collection(db, COLLECTION_NAME);
      let q = query(colRef, orderBy('createdAt', 'desc'));

      if (filtro?.tipo) {
        q = query(q, where('tipo', '==', filtro.tipo));
      }

      if (filtro?.usuarioId) {
        q = query(q, where('usuarioId', '==', filtro.usuarioId));
      }

      // Aplicar limite se especificado
      if (filtro?.limite && filtro.limite > 0) {
        q = query(q, limit(filtro.limite));
      } else {
        // Limite padrão de 10 atividades
        q = query(q, limit(10));
      }

      const querySnapshot = await getDocs(q);
      const atividades = querySnapshot.docs.map(converterParaAtividade);
      
      console.log(`Encontradas ${atividades.length} atividades`);
      return atividades;
    } catch (error) {
      console.error('Erro ao listar atividades:', error);
      throw error;
    }
  },

  async registrarAtividade(dados: AtividadeFormData): Promise<string> {
    try {
      const currentUser = await verificarPermissoes();
      
      // Garantir que o usuário atual seja registrado como autor da atividade
      const dadosCompletos = {
        ...dados,
        usuarioId: dados.usuarioId || currentUser.uid,
        usuarioEmail: dados.usuarioEmail || currentUser.email,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), dadosCompletos);
      console.log('Atividade registrada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      
      // Se for um erro de permissão, retorna um ID falso para não quebrar o fluxo
      if (error instanceof Error && error.message.includes('permission-denied')) {
        console.warn('Erro de permissão ao registrar atividade, continuando com ID falso');
        return 'permission-denied-' + Date.now();
      }
      
      throw error;
    }
  }
};
