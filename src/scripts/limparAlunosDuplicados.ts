import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Aluno } from '@/types/aluno';

const COLLECTION_NAME = 'alunos';

interface AlunoComData extends Aluno {
  updatedAt: Date;
}

async function limparAlunosDuplicados() {
  try {
    console.log('Iniciando limpeza de alunos duplicados...');
    
    // Buscar todos os alunos ativos
    const q = query(collection(db, COLLECTION_NAME), where('ativo', '==', true));
    const querySnapshot = await getDocs(q);
    
    // Agrupar alunos por matrícula
    const alunosPorMatricula: { [key: string]: AlunoComData[] } = {};
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const aluno: AlunoComData = {
        id: doc.id,
        nome: data.nome,
        matricula: data.matricula,
        email: data.email,
        tipo: data.tipo,
        turma: data.turma,
        ativo: data.ativo,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
      
      if (!alunosPorMatricula[aluno.matricula]) {
        alunosPorMatricula[aluno.matricula] = [];
      }
      alunosPorMatricula[aluno.matricula].push(aluno);
    });

    // Processar duplicatas
    let totalDuplicatas = 0;
    let totalProcessados = 0;

    for (const [matricula, alunos] of Object.entries(alunosPorMatricula)) {
      if (alunos.length > 1) {
        console.log(`\nProcessando duplicatas para matrícula ${matricula}:`);
        console.log(`- ${alunos.length} registros encontrados`);
        totalDuplicatas += alunos.length - 1;

        // Ordenar por data de atualização (mais recente primeiro)
        alunos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        // Manter o primeiro registro (mais recente) e desativar os outros
        for (let i = 1; i < alunos.length; i++) {
          const alunoParaDesativar = alunos[i];
          console.log(`- Desativando registro duplicado: ${alunoParaDesativar.nome} (ID: ${alunoParaDesativar.id})`);
          
          try {
            const docRef = doc(db, COLLECTION_NAME, alunoParaDesativar.id);
            await updateDoc(docRef, {
              ativo: false,
              updatedAt: Timestamp.now(),
              observacao: 'Registro duplicado desativado automaticamente'
            });
            totalProcessados++;
          } catch (error) {
            console.error(`Erro ao desativar aluno ${alunoParaDesativar.id}:`, error);
          }
        }
      }
    }

    console.log('\nResumo da limpeza:');
    console.log(`- Total de duplicatas encontradas: ${totalDuplicatas}`);
    console.log(`- Total de registros processados: ${totalProcessados}`);
    console.log('Limpeza concluída!');

  } catch (error) {
    console.error('Erro durante a limpeza de alunos duplicados:', error);
    throw new Error('Erro durante a limpeza de alunos duplicados');
  }
}

export default limparAlunosDuplicados;
