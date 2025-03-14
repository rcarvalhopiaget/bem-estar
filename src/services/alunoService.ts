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
  QueryConstraint,
  setDoc
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
  async listarAlunos(filtro?: AlunoFilter): Promise<Aluno[]> {
    try {
      console.log('Buscando alunos com filtro:', filtro);
      
      const colRef = collection(db, COLLECTION_NAME);
      let q = query(colRef);

      // Aplicar filtros básicos primeiro
      if (filtro?.ativo !== undefined) {
        q = query(q, where('ativo', '==', filtro.ativo));
      }

      const querySnapshot = await getDocs(q);
      let alunos = querySnapshot.docs.map(converterParaAluno);
      
      // Aplicar filtros em memória para evitar necessidade de índices compostos
      if (filtro) {
        if (filtro.turma) {
          alunos = alunos.filter(a => a.turma === filtro.turma);
        }
        if (filtro.tipo) {
          alunos = alunos.filter(a => a.tipo === filtro.tipo);
        }
      }

      // Ordenar em memória
      alunos.sort((a, b) => a.nome.localeCompare(b.nome));
      
      console.log(`Encontrados ${alunos.length} alunos`);
      return alunos;
    } catch (error) {
      console.error('Erro ao listar alunos:', error);
      throw new Error('Erro ao listar alunos');
    }
  },

  async buscarAlunoPorMatricula(matricula: string): Promise<Aluno | null> {
    try {
      console.log('Buscando aluno por matrícula:', matricula);
      const q = query(collection(db, COLLECTION_NAME), where('matricula', '==', matricula));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('Aluno não encontrado');
        return null;
      }

      return converterParaAluno(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Erro ao buscar aluno por matrícula:', error);
      throw new Error('Erro ao buscar aluno por matrícula');
    }
  },

  async buscarAluno(id: string): Promise<Aluno | null> {
    try {
      console.log('Buscando aluno por ID:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('Aluno não encontrado');
        return null;
      }

      return converterParaAluno(docSnap);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      throw new Error('Erro ao buscar aluno');
    }
  },

  async criarOuAtualizarAluno(dados: AlunoFormData) {
    try {
      console.log('Iniciando criação/atualização de aluno:', dados.nome);
      
      // Busca por matrícula existente
      const alunoExistente = await this.buscarAlunoPorMatricula(dados.matricula);
      const now = Timestamp.now();

      if (alunoExistente) {
        // Atualiza aluno existente
        console.log('Atualizando aluno existente:', alunoExistente.id);
        const docRef = doc(db, COLLECTION_NAME, alunoExistente.id);
        await updateDoc(docRef, {
          ...dados,
          updatedAt: now
        });
        console.log('Aluno atualizado com sucesso');
        return alunoExistente.id;
      } else {
        // Cria novo aluno
        console.log('Criando novo aluno');
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...dados,
          createdAt: now,
          updatedAt: now
        });
        console.log('Aluno criado com sucesso. ID:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('Erro detalhado ao criar/atualizar aluno:', error);
      throw new Error('Erro ao criar/atualizar aluno');
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
  },

  async listarTurmas(): Promise<string[]> {
    try {
      const alunosRef = collection(db, 'alunos');
      const querySnapshot = await getDocs(alunosRef);
      const turmas = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const aluno = doc.data() as Aluno;
        if (aluno.turma) {
          turmas.add(aluno.turma);
        }
      });
      
      return Array.from(turmas).sort();
    } catch (error) {
      console.error('Erro ao listar turmas:', error);
      throw error;
    }
  }
};