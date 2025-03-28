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
  limit,
  setDoc
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
      console.log('Iniciando registro de atividade:', dados);
      
      let currentUser;
      try {
        currentUser = await verificarPermissoes();
        console.log('Usuário autenticado para registro de atividade:', currentUser?.email);
      } catch (error) {
        console.warn('Erro na verificação de permissões, continuando sem usuário autenticado:', error);
        // Continua mesmo sem usuário autenticado para não bloquear o fluxo principal
      }
      
      // Garantir que o usuário atual seja registrado como autor da atividade
      const dadosCompletos = {
        ...dados,
        usuarioId: dados.usuarioId || currentUser?.uid || 'sistema',
        usuarioEmail: dados.usuarioEmail || currentUser?.email || 'sistema@app.com',
        createdAt: Timestamp.now()
      };
      
      console.log('Dados completos da atividade:', dadosCompletos);

      // Adicionar um identificador único baseado em timestamp para evitar conflitos de ID
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const docRef = doc(collection(db, COLLECTION_NAME), uniqueId);
      
      try {
        // Usar setDoc em vez de addDoc para definir explicitamente o ID do documento
        await setDoc(docRef, dadosCompletos);
        console.log('Atividade registrada com sucesso, ID:', uniqueId);
        return uniqueId;
      } catch (error: any) {
        // Tratar especificamente o erro "already-exists"
        if (error?.code === 'already-exists') {
          console.warn('ID de atividade já existe, gerando novo ID...');
          // Tentar novamente com outro ID
          const newUniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          const newDocRef = doc(collection(db, COLLECTION_NAME), newUniqueId);
          await setDoc(newDocRef, dadosCompletos);
          console.log('Atividade registrada com novo ID:', newUniqueId);
          return newUniqueId;
        }
        throw error;
      }
    } catch (error: any) {
      // Melhorar o log para diferenciar tipos de erro
      if (error?.code === 'already-exists') {
        console.warn('Erro de ID duplicado ao registrar atividade:', error);
      } else if (error?.code === 'permission-denied') {
        console.warn('Erro de permissão ao registrar atividade:', error);
      } else {
        console.error('Erro desconhecido ao registrar atividade:', error);
        console.error('Detalhes completos do erro:', JSON.stringify({
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
          dados
        }, null, 2));
      }
      
      // Se for um erro de permissão, retorna um ID falso para não quebrar o fluxo
      if ((error instanceof Error && error.message.includes('permission-denied')) || 
          (error as { code: string }).code === 'permission-denied') {
        console.warn('Erro de permissão ao registrar atividade, continuando com ID falso');
        return 'permission-denied-' + Date.now();
      }
      
      // Para qualquer outro erro, também gera um ID falso para não quebrar o fluxo
      return 'error-' + Date.now();
    }
  }
};
