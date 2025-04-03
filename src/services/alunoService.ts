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
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Aluno, AlunoFormData, AlunoFilter } from '@/types/aluno';
import { atividadeService } from '@/services/atividadeService';

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
      console.error('Erro ao listar alunos:', error instanceof Error ? error.message : JSON.stringify(error));
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
      console.error('Erro ao buscar aluno por matrícula:', error instanceof Error ? error.message : JSON.stringify(error));
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
      console.error('Erro ao buscar aluno:', error instanceof Error ? error.message : JSON.stringify(error));
      throw new Error('Erro ao buscar aluno');
    }
  },

  async criarOuAtualizarAluno(dados: AlunoFormData): Promise<string> {
    try {
      console.log('Criando ou atualizando aluno:', dados);
      
      // Verificar se já existe um aluno com a mesma matrícula
      const alunoExistente = await this.buscarAlunoPorMatricula(dados.matricula);
      
      if (alunoExistente) {
        console.log('Aluno já existe, atualizando:', alunoExistente.id);
        await this.atualizarAluno(alunoExistente.id, dados);
        
        // Registrar atividade de atualização
        try {
          await atividadeService.registrarAtividade({
            tipo: 'ALUNO',
            descricao: `Aluno ${dados.nome} (${dados.matricula}) foi atualizado`,
            usuarioId: '',
            usuarioEmail: '',
            entidadeId: alunoExistente.id,
            entidadeTipo: 'aluno'
          });
        } catch (error) {
          console.warn('Erro ao registrar atividade de atualização de aluno, continuando fluxo:', error);
        }
        
        return alunoExistente.id;
      }
      
      // Criar novo aluno
      const novoAluno = {
        ...dados,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoAluno);
      console.log('Novo aluno criado com ID:', docRef.id);
      
      // Registrar atividade de criação
      try {
        await atividadeService.registrarAtividade({
          tipo: 'ALUNO',
          descricao: `Novo aluno ${dados.nome} (${dados.matricula}) foi cadastrado`,
          usuarioId: '',
          usuarioEmail: '',
          entidadeId: docRef.id,
          entidadeTipo: 'aluno'
        });
      } catch (error) {
        console.warn('Erro ao registrar atividade de criação de aluno, continuando fluxo:', error);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar/atualizar aluno:', error instanceof Error ? error.message : JSON.stringify(error));
      throw new Error('Erro ao salvar aluno');
    }
  },

  async atualizarAluno(id: string, dados: Partial<AlunoFormData>): Promise<void> {
    try {
      const alunoRef = doc(db, COLLECTION_NAME, id);
      const alunoAtual = await getDoc(alunoRef);
      
      if (!alunoAtual.exists()) {
        throw new Error(`Aluno com ID ${id} não encontrado`);
      }
      
      await updateDoc(alunoRef, {
        ...dados,
        updatedAt: new Date()
      });
      
      // Registrar atividade de atualização
      try {
        await atividadeService.registrarAtividade({
          tipo: 'ALUNO',
          descricao: `Aluno ${dados.nome || alunoAtual.data().nome} foi atualizado`,
          usuarioId: '',
          usuarioEmail: '',
          entidadeId: id,
          entidadeTipo: 'aluno'
        });
      } catch (error) {
        console.warn('Erro ao registrar atividade de atualização de aluno, continuando fluxo:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error instanceof Error ? error.message : JSON.stringify(error));
      throw new Error('Erro ao atualizar aluno');
    }
  },

  async excluirAluno(id: string): Promise<void> {
    try {
      const alunoRef = doc(db, COLLECTION_NAME, id);
      const alunoDoc = await getDoc(alunoRef);
      
      if (!alunoDoc.exists()) {
        throw new Error(`Aluno com ID ${id} não encontrado`);
      }
      
      const alunoData = alunoDoc.data();
      
      await deleteDoc(alunoRef);
      
      // Registrar atividade de exclusão
      try {
        await atividadeService.registrarAtividade({
          tipo: 'ALUNO',
          descricao: `Aluno ${alunoData.nome} (${alunoData.matricula}) foi excluído`,
          usuarioId: '',
          usuarioEmail: '',
          entidadeId: id,
          entidadeTipo: 'aluno'
        });
      } catch (error) {
        console.warn('Erro ao registrar atividade de exclusão de aluno, continuando fluxo:', error);
      }
    } catch (error) {
      console.error('Erro ao excluir aluno:', error instanceof Error ? error.message : JSON.stringify(error));
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
      console.error('Erro ao listar turmas:', error instanceof Error ? error.message : JSON.stringify(error));
      throw new Error('Erro ao listar turmas');
    }
  },

  async apagarTodosAlunos(): Promise<{ excluidos: number; erros: number }> {
    console.warn('Iniciando exclusão de TODOS os alunos...');
    let excluidos = 0;
    let erros = 0;

    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        excluidos++;
      });

      if (excluidos > 0) {
        await batch.commit();
        console.log(`${excluidos} alunos excluídos com sucesso.`);
        // Registrar atividade de exclusão em massa (opcional)
        try {
          await atividadeService.registrarAtividade({
            tipo: 'ALUNO',
            descricao: `Exclusão em massa de ${excluidos} alunos realizada.`,
            usuarioId: 'SISTEMA', // Ou obter ID do usuário logado se possível
            usuarioEmail: 'sistema@importacao', // Ou obter email do usuário logado
            entidadeId: 'TODOS',
            entidadeTipo: 'alunos'
          });
        } catch (logError) {
          console.warn('Erro ao registrar atividade de exclusão em massa:', logError);
        }
      } else {
        console.log('Nenhum aluno encontrado para excluir.');
      }
    } catch (error) {
      console.error('Erro ao excluir alunos em massa:', error);
      erros = excluidos; // Assume que todos falharam se o batch falhar
      excluidos = 0;
    }

    console.warn('Exclusão de alunos concluída.');
    return { excluidos, erros };
  }
};