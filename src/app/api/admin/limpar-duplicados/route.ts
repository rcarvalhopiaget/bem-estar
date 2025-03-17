import { NextResponse } from 'next/server';
import { Aluno } from '@/types/aluno';
import { adminDb } from '@/lib/firebase-admin';

const COLLECTION_NAME = 'alunos';

interface AlunoComData extends Aluno {
  updatedAt: Date;
}

interface ResultadoLimpeza {
  resultados: string[];
  totalDuplicatas: number;
  totalProcessados: number;
}

// Lista de matrículas que devem ser ignoradas no processo de limpeza
const MATRICULAS_IGNORADAS = ['MCGDO1348', 'OCS5526', 'LMP1333'];

async function limparAlunosDuplicados(): Promise<ResultadoLimpeza> {
  try {
    console.log('Iniciando limpeza de alunos duplicados...');
    const alunosRef = adminDb.collection(COLLECTION_NAME);
    let totalDuplicatas = 0;
    let totalProcessados = 0;
    const resultados: string[] = [];
    
    // Buscar todos os alunos ativos
    console.log('Buscando alunos ativos...');
    const alunosAtivosSnapshot = await alunosRef
      .where('ativo', '==', true)
      .get();

    console.log(`${alunosAtivosSnapshot.docs.length} alunos ativos encontrados`);

    // Agrupar por matrícula para identificar duplicatas
    const contagemPorMatricula: { [key: string]: number } = {};
    const contagemPorNome: { [key: string]: number } = {};
    const alunosPorMatricula: { [key: string]: any[] } = {};
    const alunosPorNome: { [key: string]: any[] } = {};
    
    alunosAtivosSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const matricula = data?.matricula;
      const nome = data?.nome;
      
      // Agrupar por matrícula
      if (matricula && typeof matricula === 'string' && matricula.trim() !== '') {
        contagemPorMatricula[matricula] = (contagemPorMatricula[matricula] || 0) + 1;
        
        if (!alunosPorMatricula[matricula]) {
          alunosPorMatricula[matricula] = [];
        }
        alunosPorMatricula[matricula].push({
          id: doc.id,
          ...data
        });
      }
      
      // Agrupar por nome
      if (nome && typeof nome === 'string' && nome.trim() !== '') {
        // Normalizar o nome para comparação (remover espaços extras, converter para minúsculas)
        const nomeNormalizado = nome.trim().toLowerCase();
        
        contagemPorNome[nomeNormalizado] = (contagemPorNome[nomeNormalizado] || 0) + 1;
        
        if (!alunosPorNome[nomeNormalizado]) {
          alunosPorNome[nomeNormalizado] = [];
        }
        alunosPorNome[nomeNormalizado].push({
          id: doc.id,
          ...data
        });
      }
    });

    // Identificar matrículas com duplicatas, excluindo as que devem ser ignoradas
    const matriculasComDuplicatas = Object.entries(contagemPorMatricula)
      .filter(([_, count]) => count > 1)
      .map(([matricula]) => matricula)
      .filter(matricula => !MATRICULAS_IGNORADAS.includes(matricula));

    // Identificar nomes com duplicatas
    const nomesComDuplicatas = Object.entries(contagemPorNome)
      .filter(([_, count]) => count > 1)
      .map(([nome]) => nome);

    console.log(`${matriculasComDuplicatas.length} matrículas com duplicatas (excluindo matrículas ignoradas)`);
    console.log(`${nomesComDuplicatas.length} nomes com duplicatas`);

    if (matriculasComDuplicatas.length === 0 && nomesComDuplicatas.length === 0) {
      return {
        resultados: ['Nenhuma duplicata encontrada para processamento.'],
        totalDuplicatas: 0,
        totalProcessados: 0
      };
    }

    // Processar duplicatas por matrícula
    resultados.push('=== Duplicatas por matrícula ===');
    if (matriculasComDuplicatas.length === 0) {
      resultados.push('Nenhuma duplicata por matrícula encontrada.');
    } else {
      // Processar cada matrícula com duplicata
      for (const matricula of matriculasComDuplicatas) {
        console.log(`Processando matrícula: ${matricula}`);
        try {
          // Buscar todos os alunos ativos com esta matrícula, ordenados por data de atualização
          const alunosSnapshot = await alunosRef
            .where('matricula', '==', matricula)
            .where('ativo', '==', true)
            .orderBy('updatedAt', 'desc')
            .get();
          
          const alunos = alunosSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data.nome || 'Sem nome',
              matricula: data.matricula,
              email: data.email || '',
              tipo: data.tipo || 'MENSALISTA',
              turma: data.turma || 'Sem turma',
              ativo: data.ativo === true,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            } as AlunoComData;
          });

          if (alunos.length > 1) {
            resultados.push(`\nProcessando duplicatas para matrícula ${matricula}:`);
            resultados.push(`- ${alunos.length} registros encontrados`);
            totalDuplicatas += alunos.length - 1;

            // Manter o registro mais recente
            const alunoAtivo = alunos[0];
            resultados.push(`- Mantendo registro mais recente: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (ID: ${alunoAtivo.id})`);

            // Desativar os registros duplicados
            const batch = adminDb.batch();
            for (let i = 1; i < alunos.length; i++) {
              const alunoParaDesativar = alunos[i];
              resultados.push(`- Desativando registro duplicado: ${alunoParaDesativar.nome} (${alunoParaDesativar.tipo}) (ID: ${alunoParaDesativar.id})`);

              const docRef = adminDb.doc(`${COLLECTION_NAME}/${alunoParaDesativar.id}`);
              batch.update(docRef, {
                ativo: false,
                updatedAt: new Date(),
                observacao: `Registro duplicado desativado automaticamente. Matrícula mantida em: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (ID: ${alunoAtivo.id})`
              });
            }

            try {
              await batch.commit();
              totalProcessados += alunos.length - 1;
              // Pequena pausa entre os lotes
              await new Promise(resolve => setTimeout(resolve, 500));
              resultados.push(`- Operação para matrícula ${matricula} concluída com sucesso`);
            } catch (error) {
              console.error(`Erro ao desativar alunos da matrícula ${matricula}:`, error);
              resultados.push(`- ERRO ao processar matrícula ${matricula}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              // Continuamos processando outras matrículas
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar ou processar alunos da matrícula ${matricula}:`, error);
          resultados.push(`- ERRO ao buscar alunos da matrícula ${matricula}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          // Pulamos esta matrícula e continuamos com a próxima
        }
      }
    }

    // Processar duplicatas por nome
    resultados.push('\n=== Duplicatas por nome ===');
    if (nomesComDuplicatas.length === 0) {
      resultados.push('Nenhuma duplicata por nome encontrada.');
    } else {
      // Processar cada nome com duplicata
      for (const nome of nomesComDuplicatas) {
        console.log(`Processando nome: ${nome}`);
        try {
          // Buscar todos os alunos ativos com este nome, ordenados por data de atualização
          const alunosSnapshot = await alunosRef
            .where('nome', '==', nome)
            .where('ativo', '==', true)
            .orderBy('updatedAt', 'desc')
            .get();
          
          const alunos = alunosSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data.nome || 'Sem nome',
              matricula: data.matricula,
              email: data.email || '',
              tipo: data.tipo || 'MENSALISTA',
              turma: data.turma || 'Sem turma',
              ativo: data.ativo === true,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            } as AlunoComData;
          });

          if (alunos.length > 1) {
            resultados.push(`\nProcessando duplicatas para nome ${nome}:`);
            resultados.push(`- ${alunos.length} registros encontrados`);
            totalDuplicatas += alunos.length - 1;

            // Manter o registro mais recente
            const alunoAtivo = alunos[0];
            resultados.push(`- Mantendo registro mais recente: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (ID: ${alunoAtivo.id})`);

            // Desativar os registros duplicados
            const batch = adminDb.batch();
            for (let i = 1; i < alunos.length; i++) {
              const alunoParaDesativar = alunos[i];
              resultados.push(`- Desativando registro duplicado: ${alunoParaDesativar.nome} (${alunoParaDesativar.tipo}) (ID: ${alunoParaDesativar.id})`);

              const docRef = adminDb.doc(`${COLLECTION_NAME}/${alunoParaDesativar.id}`);
              batch.update(docRef, {
                ativo: false,
                updatedAt: new Date(),
                observacao: `Registro duplicado desativado automaticamente. Nome mantido em: ${alunoAtivo.nome} (${alunoAtivo.tipo}) (ID: ${alunoAtivo.id})`
              });
            }

            try {
              await batch.commit();
              totalProcessados += alunos.length - 1;
              // Pequena pausa entre os lotes
              await new Promise(resolve => setTimeout(resolve, 500));
              resultados.push(`- Operação para nome ${nome} concluída com sucesso`);
            } catch (error) {
              console.error(`Erro ao desativar alunos do nome ${nome}:`, error);
              resultados.push(`- ERRO ao processar nome ${nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              // Continuamos processando outros nomes
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar ou processar alunos do nome ${nome}:`, error);
          resultados.push(`- ERRO ao buscar alunos do nome ${nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          // Pulamos este nome e continuamos com o próximo
        }
      }
    }

    if (totalProcessados === 0) {
      return {
        resultados: ['Nenhum registro foi processado. Verificar logs para mais detalhes.'],
        totalDuplicatas,
        totalProcessados
      };
    }

    resultados.push('\nResumo da limpeza:');
    resultados.push(`- Total de duplicatas encontradas: ${totalDuplicatas}`);
    resultados.push(`- Total de registros processados: ${totalProcessados}`);
    
    // Garantir que o objeto retornado tenha todos os campos necessários
    return { 
      resultados: Array.isArray(resultados) ? resultados : [], 
      totalDuplicatas: Number(totalDuplicatas) || 0, 
      totalProcessados: Number(totalProcessados) || 0 
    };
  } catch (error: any) {
    console.error('Erro durante a limpeza de alunos duplicados:', error instanceof Error ? error.message : JSON.stringify(error));
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido durante a limpeza';
    throw new Error(mensagem);
  }
}

export async function POST() {
  try {
    // Verificar se as variáveis de ambiente necessárias estão configuradas
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Configuração do Firebase Admin SDK incompleta. Verifique as variáveis de ambiente.');
      return NextResponse.json({
        error: 'Configuração do Firebase Admin SDK incompleta. Contate o administrador do sistema.',
        resultados: ['Erro: Configuração do Firebase Admin SDK incompleta. Contate o administrador do sistema.'],
        totalDuplicatas: 0,
        totalProcessados: 0
      }, { status: 500 });
    }

    console.log('Iniciando processo de limpeza...');
    const resultado = await limparAlunosDuplicados();
    console.log('Processo finalizado com sucesso:', resultado);

    // Garantir que todos os campos estejam definidos
    const resposta = {
      resultados: Array.isArray(resultado.resultados) ? resultado.resultados : [],
      totalDuplicatas: typeof resultado.totalDuplicatas === 'number' ? resultado.totalDuplicatas : 0,
      totalProcessados: typeof resultado.totalProcessados === 'number' ? resultado.totalProcessados : 0,
      error: null
    };
    
    console.log('Enviando resposta:', resposta);
    return NextResponse.json(resposta);
  } catch (error: any) {
    console.error('Erro na rota de limpeza:', error instanceof Error ? error.message : JSON.stringify(error));
    const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido ao processar a limpeza';
    
    const respostaErro = { 
      error: mensagemErro,
      resultados: [`Erro: ${mensagemErro}`],
      totalDuplicatas: 0,
      totalProcessados: 0
    };
    
    console.log('Enviando resposta de erro:', respostaErro);
    return NextResponse.json(respostaErro, { status: 500 });
  }
}
