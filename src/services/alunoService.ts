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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Aluno, AlunoFormData, AlunoFilter } from '@/types/aluno';

const COLLECTION_NAME = 'alunos';

const converterParaAluno = (doc: DocumentData): Aluno => {
  const data = doc.data();
  return {
    id: doc.id,
    nome: data.nome,
    matricula: data.matricula,
    email: data.email,
    tipo: data.tipo,
    turma: data.turma,
    ativo: data.ativo ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
};

export const alunoService = {
  async listarAlunos(filtros?: AlunoFilter) {
    try {
      console.log('Iniciando listagem de alunos com filtros:', filtros);
      
      const alunoRef = collection(db, COLLECTION_NAME);
      let q = query(alunoRef);

      if (filtros?.ativo !== undefined) {
        q = query(q, where('ativo', '==', filtros.ativo));
      }

      const querySnapshot = await getDocs(q);
      console.log(`Encontrados ${querySnapshot.size} alunos`);

      const alunos = querySnapshot.docs.map(converterParaAluno);
      
      alunos.sort((a, b) => a.nome.localeCompare(b.nome));
      
      console.log('Alunos processados com sucesso');

      return alunos;
    } catch (error) {
      console.error('Erro detalhado ao listar alunos:', error);
      throw new Error('Erro ao listar alunos. Por favor, tente novamente.');
    }
  },

  async buscarAluno(id: string) {
    try {
      console.log('Buscando aluno com ID:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('Aluno não encontrado');
        return null;
      }

      const aluno = converterParaAluno(docSnap);
      console.log('Aluno encontrado:', aluno.nome);
      return aluno;
    } catch (error) {
      console.error('Erro detalhado ao buscar aluno:', error);
      throw new Error('Erro ao buscar aluno');
    }
  },

  async criarAluno(dados: AlunoFormData) {
    try {
      console.log('Iniciando criação de aluno:', dados.nome);
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...dados,
        createdAt: now,
        updatedAt: now
      });
      console.log('Aluno criado com sucesso. ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro detalhado ao criar aluno:', error);
      throw new Error('Erro ao criar aluno');
    }
  },

  async atualizarAluno(id: string, dados: Partial<AlunoFormData>) {
    try {
      console.log('Iniciando atualização do aluno:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...dados,
        updatedAt: Timestamp.now()
      });
      console.log('Aluno atualizado com sucesso');
    } catch (error) {
      console.error('Erro detalhado ao atualizar aluno:', error);
      throw new Error('Erro ao atualizar aluno');
    }
  },

  async excluirAluno(id: string) {
    try {
      console.log('Iniciando exclusão do aluno:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('Aluno excluído com sucesso');
    } catch (error) {
      console.error('Erro detalhado ao excluir aluno:', error);
      throw new Error('Erro ao excluir aluno');
    }
  }
}; 