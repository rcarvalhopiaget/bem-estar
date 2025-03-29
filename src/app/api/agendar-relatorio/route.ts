import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { enviarRelatorioDiario, obterConfiguracaoEnvioRelatorio } from '@/services/emailService';
import { emailConfig } from '@/config/email.config';

// Modo de simulação baseado apenas na configuração
const MODO_SIMULACAO = emailConfig.testMode;

/**
 * API para agendar o envio de relatórios diários
 * Esta API é chamada por um cron job para enviar relatórios diários
 */
export async function GET(request: Request) {
  try {
    initializeFirebaseAdmin(); // Garante que o SDK Admin está inicializado
    const adminDb = admin.firestore();
    const Timestamp = admin.firestore.Timestamp;

    // Verificar se o envio de relatórios está ativo (usando Admin SDK)
    let configuracaoAtiva = true;
    try {
      const configDoc = await adminDb.collection('configuracoes').doc('envioRelatorio').get();
      if (configDoc.exists) {
        configuracaoAtiva = configDoc.data()?.ativo ?? true;
      } else {
        console.log('Documento de configuração envioRelatorio não encontrado, usando padrão (ativo).')
      }
      
      if (!configuracaoAtiva) {
        console.log('Envio de relatórios está desativado nas configurações.')
        return NextResponse.json({
          success: false,
          message: 'Envio de relatórios está desativado nas configurações',
        });
      }
    } catch (configError: any) {
       console.error('Erro ao obter configuração de envio do Firestore:', configError)
       // Decide-se continuar ou não dependendo da criticidade
       // return NextResponse.json({ success: false, error: 'Erro ao ler configuração' }, { status: 500 });
       console.log('Continuando com envio ativo como padrão devido a erro na leitura da config.')
    }

    // Obtendo a data - **REMOVIDO USO DINÂMICO de request.url**
    // Se precisar de data dinâmica via param, a rota deve ser dinâmica.
    // const dataParam = getSearchParam(request, 'data');
    const dataRelatorio = new Date(); // Usar a data atual do servidor
    
    // Formatar a data para YYYY-MM-DD
    const dataFormatada = dataRelatorio.toISOString().split('T')[0];
    
    // Verificar se deve usar modo de simulação (apenas via config agora)
    const usarSimulacao = MODO_SIMULACAO;
    // const forcarSimulacaoParam = getSearchParam(request, 'simulacao') === 'true';
    // const usarSimulacao = MODO_SIMULACAO || forcarSimulacaoParam;
    
    if (usarSimulacao) {
      console.log('[SIMULAÇÃO] Gerando relatório simulado para', dataFormatada);
      
      // Dados simulados para teste
      const dadosSimulados = {
        data: dataFormatada,
        totalAlunos: 50,
        totalComeram: 35,
        totalNaoComeram: 15,
        alunosComeram: Array(35).fill(0).map((_, i) => ({ 
          nome: `Aluno Simulado ${i+1}`, 
          turma: `Turma ${Math.floor(i/10) + 1}` 
        })),
        alunosNaoComeram: Array(15).fill(0).map((_, i) => ({ 
          nome: `Aluno Não Presente ${i+1}`, 
          turma: `Turma ${Math.floor(i/5) + 1}` 
        })),
        refeicoesPorTipo: {
          'Almoço': 20,
          'Lanche da Manhã': 8,
          'Lanche da Tarde': 7
        },
        refeicoes: Array(35).fill(0).map((_, i) => {
          const tiposRefeicao = ['Almoço', 'Lanche da Manhã', 'Lanche da Tarde'];
          const tipo = tiposRefeicao[Math.floor(Math.random() * tiposRefeicao.length)];
          const hora = tipo === 'Almoço' ? 12 : (tipo === 'Lanche da Manhã' ? 9 : 15);
          const dataRefeicao = new Date(dataFormatada);
          dataRefeicao.setHours(hora, Math.floor(Math.random() * 59));
          
          return {
            alunoId: `aluno-${i+1}`,
            nomeAluno: `Aluno Simulado ${i+1}`,
            turma: `Turma ${Math.floor(i/10) + 1}`,
            tipo: tipo,
            data: dataRefeicao
          };
        })
      };
      
      // Enviar relatório simulado
      await enviarRelatorioDiario(dadosSimulados);
      
      return NextResponse.json({
        success: true,
        message: '[SIMULAÇÃO] Relatório simulado enviado com sucesso',
        data: {
          dataRelatorio: dataFormatada,
          totalAlunos: dadosSimulados.totalAlunos,
          totalComeram: dadosSimulados.totalComeram,
          totalNaoComeram: dadosSimulados.totalNaoComeram,
          simulado: true
        }
      });
    }
    
    // ----- Lógica de Geração de Relatório Real (usando Admin SDK) -----
    try {
      // Buscar todos os alunos
      const alunosRef = adminDb.collection('alunos');
      const alunosSnapshot = await alunosRef.get();
      const alunos = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || '',
        turma: doc.data().turma || ''
        // ... outros dados do aluno se necessário
      }));
      
      // Buscar as refeições do dia
      const refeicoesRef = adminDb.collection('refeicoes');
      const dataInicio = new Date(dataFormatada);
      dataInicio.setHours(0, 0, 0, 0); // Início do dia
      const dataFim = new Date(dataFormatada);
      dataFim.setHours(23, 59, 59, 999); // Fim do dia
      
      const refeicoesQuery = refeicoesRef
        .where('data', '>=', Timestamp.fromDate(dataInicio))
        .where('data', '<', Timestamp.fromDate(dataFim)); // Correção: usar dataFim
      
      const refeicoesSnapshot = await refeicoesQuery.get();
      const refeicoes = refeicoesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          alunoId: data.alunoId,
          nomeAluno: data.nomeAluno || '',
          turma: data.turma || '',
          tipo: data.tipo || 'ALMOCO', // Use um valor padrão seguro
          data: (data.data as admin.firestore.Timestamp)?.toDate() ?? new Date() // Converter Timestamp para Date
        };
      });
      
      // Mapear os IDs dos alunos que comeram
      const alunosQueComeram = new Set(refeicoes.map(r => r.alunoId));
      
      // Separar alunos que comeram e não comeram
      const alunosComeram = alunos
        .filter(aluno => alunosQueComeram.has(aluno.id))
        .map(aluno => ({ nome: aluno.nome, turma: aluno.turma }));
      
      const alunosNaoComeram = alunos
        .filter(aluno => !alunosQueComeram.has(aluno.id))
        .map(aluno => ({ nome: aluno.nome, turma: aluno.turma }));
      
      // Contar refeições por tipo
      const refeicoesPorTipo: Record<string, number> = {};
      refeicoes.forEach(refeicao => {
        const tipoFormatado = formatarTipoRefeicao(refeicao.tipo);
        refeicoesPorTipo[tipoFormatado] = (refeicoesPorTipo[tipoFormatado] || 0) + 1;
      });
      
      // Formatar as refeições para o relatório
      const refeicoesFormatadas = refeicoes.map(refeicao => ({
        alunoId: refeicao.alunoId,
        nomeAluno: refeicao.nomeAluno,
        turma: refeicao.turma,
        tipo: formatarTipoRefeicao(refeicao.tipo),
        data: refeicao.data
      }));
      
      // Preparar dados para o relatório
      const dadosRelatorio = {
        data: dataFormatada,
        totalAlunos: alunos.length,
        totalComeram: alunosComeram.length,
        totalNaoComeram: alunosNaoComeram.length,
        alunosComeram,
        alunosNaoComeram,
        refeicoesPorTipo,
        refeicoes: refeicoesFormatadas
      };
      
      // Enviar o relatório por email
      await enviarRelatorioDiario(dadosRelatorio);
      
      return NextResponse.json({
        success: true,
        message: 'Relatório enviado com sucesso',
        data: {
          dataRelatorio: dataFormatada,
          totalAlunos: alunos.length,
          totalComeram: alunosComeram.length,
          totalNaoComeram: alunosNaoComeram.length
        }
      });
    } catch (dbError: any) {
      console.error('Erro ao buscar dados no Firestore:', dbError);
      // Decide se envia um relatório simulado ou falha
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar dados para o relatório.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro inesperado na função GET /api/agendar-relatorio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar o tipo de refeição
function formatarTipoRefeicao(tipo: string): string {
  switch (tipo?.toUpperCase()) {
    case 'ALMOCO':
      return 'Almoço';
    case 'LANCHE_MANHA':
      return 'Lanche da Manhã';
    case 'LANCHE_TARDE':
      return 'Lanche da Tarde';
    default:
      return tipo || 'Desconhecido';
  }
}
