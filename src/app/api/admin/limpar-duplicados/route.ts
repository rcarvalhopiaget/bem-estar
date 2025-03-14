import { NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Aluno } from '@/types/aluno';

const COLLECTION_NAME = 'alunos';

// Inicializa o Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

interface AlunoComData extends Aluno {
  updatedAt: Date;
}

async function limparAlunosDuplicados() {
  try {
    console.log('Iniciando limpeza de alunos duplicados...');
    
    // Buscar todos os alunos ativos, ordenados por data de atualização
    const alunosRef = db.collection(COLLECTION_NAME);
    const querySnapshot = await alunosRef
      .where('ativo', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();
    
    if (querySnapshot.empty) {
      return {
        resultados: ['Nenhum aluno ativo encontrado no sistema.'],
        totalDuplicatas: 0,
        totalProcessados: 0
      };
    }
    
    // Agrupar alunos por matrícula
    const alunosPorMatricula: { [key: string]: AlunoComData[] } = {};
    
    querySnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      
      // Validar dados obrigatórios
      if (!data.matricula) {
        console.warn(`Aluno ${docSnapshot.id} sem matrícula, ignorando...`);
        return;
      }
      
      const aluno: AlunoComData = {
        id: docSnapshot.id,
        nome: data.nome || 'Sem nome',
        matricula: data.matricula,
        email: data.email || '',
        tipo: data.tipo || 'MENSALISTA',
        turma: data.turma || 'Sem turma',
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
    const resultados: string[] = [];

    for (const [matricula, alunos] of Object.entries(alunosPorMatricula)) {
      if (alunos.length > 1) {
        resultados.push(`\nProcessando duplicatas para matrícula ${matricula}:`);
        resultados.push(`- ${alunos.length} registros encontrados`);
        totalDuplicatas += alunos.length - 1;

        // Ordenar por data de atualização (mais recente primeiro)
        alunos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        // Manter o primeiro registro (mais recente) e desativar os outros
        const alunoAtivo = alunos[0];
        resultados.push(`- Mantendo registro mais recente: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (ID: ${alunoAtivo.id})`);

        for (let i = 1; i < alunos.length; i++) {
          const alunoParaDesativar = alunos[i];
          resultados.push(`- Desativando registro duplicado: ${alunoParaDesativar.nome} (${alunoParaDesativar.tipo}) (ID: ${alunoParaDesativar.id})`);
          
          try {
            await db.doc(`${COLLECTION_NAME}/${alunoParaDesativar.id}`).update({
              ativo: false,
              updatedAt: new Date(),
              observacao: `Registro duplicado desativado automaticamente. Matrícula mantida em: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (${alunoAtivo.id})`
            });
            totalProcessados++;
          } catch (error) {
            console.error(`Erro ao desativar aluno ${alunoParaDesativar.id}:`, error);
            resultados.push(`- ERRO ao desativar aluno ${alunoParaDesativar.nome} (${alunoParaDesativar.tipo}) (${alunoParaDesativar.id})`);
            throw new Error(`Erro ao desativar aluno ${alunoParaDesativar.nome}`);
          }
        }
      }
    }

    if (totalDuplicatas === 0) {
      return {
        resultados: ['Nenhuma duplicata encontrada no sistema.'],
        totalDuplicatas: 0,
        totalProcessados: 0
      };
    }

    resultados.push('\nResumo da limpeza:');
    resultados.push(`- Total de duplicatas encontradas: ${totalDuplicatas}`);
    resultados.push(`- Total de registros processados: ${totalProcessados}`);
    
    return { resultados, totalDuplicatas, totalProcessados };

  } catch (error) {
    console.error('Erro durante a limpeza de alunos duplicados:', error);
    throw error;
  }
}

export async function POST() {
  try {
    const resultado = await limparAlunosDuplicados();
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro na rota de limpeza:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao processar a limpeza de duplicados',
        resultados: [],
        totalDuplicatas: 0,
        totalProcessados: 0
      },
      { status: 500 }
    );
  }
}
