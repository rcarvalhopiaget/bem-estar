import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { enviarRelatorioDiario } from '@/services/emailService.server';
import { emailConfig } from '@/config/email.config';

// Modo de simulação baseado apenas na configuração
const MODO_SIMULACAO = emailConfig.testMode;

/**
 * API para agendar o envio de relatórios diários
 * Esta API é chamada por um cron job para enviar relatórios diários
 */
export async function GET(request: Request) {
  try {
    const adminApp = initializeFirebaseAdmin(); // Garante inicialização e obtém a instância
    const adminDb = admin.firestore(adminApp); // Usa a instância específica
    const Timestamp = admin.firestore.Timestamp;

    // --- Buscar Configuração de Envio (Usando Admin SDK) ---
    let emailsDestino: string[] = [];
    let configuracaoAtiva = true;
    try {
      const configDoc = await adminDb.collection('configuracoes').doc('envioRelatorio').get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        configuracaoAtiva = configData?.ativo ?? true;
        // Garantir que emails seja um array de strings
        emailsDestino = Array.isArray(configData?.emails) 
                        ? configData.emails.filter((e: any) => typeof e === 'string' && e.trim() !== '') 
                        : [];
      } else {
        console.log('Documento de configuração envioRelatorio não encontrado, envio desativado por padrão.');
        configuracaoAtiva = false; // Desativar se config não existe
      }
      
      if (!configuracaoAtiva) {
        console.log('Envio de relatórios está desativado nas configurações.');
        return NextResponse.json({
          success: false,
          message: 'Envio de relatórios está desativado nas configurações',
        });
      }
      if (emailsDestino.length === 0) {
         console.log('Nenhum email de destino configurado para o envio de relatórios.');
         return NextResponse.json({
           success: false,
           message: 'Nenhum email de destino configurado',
         });
      }
    } catch (configError: any) {
       console.error('Erro ao obter configuração de envio do Firestore:', configError);
       // Considerar falhar aqui, pois sem emails não há envio
       return NextResponse.json({ success: false, error: 'Erro ao ler configuração de envio' }, { status: 500 });
    }
    // --- Fim Buscar Configuração ---

    // CALCULAR A DATA DO DIA ANTERIOR
    const hoje = new Date();
    const dataRelatorio = new Date(hoje); 
    dataRelatorio.setDate(hoje.getDate() - 1); // Subtrai 1 dia
    
    // Formatar a data do dia anterior como YYYY-MM-DD
    const dataFormatada = dataRelatorio.toISOString().split('T')[0]; 
    console.log(`[API /agendar-relatorio] Iniciando geração para data: ${dataFormatada}`);

    const usarSimulacao = MODO_SIMULACAO; 
    
    if (usarSimulacao) {
      console.log(`[API /agendar-relatorio] [SIMULAÇÃO] Gerando relatório simulado para ${dataFormatada}`);
      const dadosSimulados = {
        data: dataFormatada, // <-- Usa data do dia anterior
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
          const dataRefeicaoSimulada = new Date(dataFormatada); // Baseia na data do relatório
          dataRefeicaoSimulada.setHours(hora, Math.floor(Math.random() * 59));
          
          return {
            alunoId: `aluno-${i+1}`,
            nomeAluno: `Aluno Simulado ${i+1}`,
            turma: `Turma ${Math.floor(i/10) + 1}`,
            tipo: tipo,
            data: dataRefeicaoSimulada
          };
        })
      };
      
      await enviarRelatorioDiario(dadosSimulados, emailsDestino); 
      
      return NextResponse.json({
        success: true,
        message: `[SIMULAÇÃO] Relatório simulado para ${dataFormatada} enviado com sucesso`,
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
      const alunosRef = adminDb.collection('alunos');
      const alunosSnapshot = await alunosRef.get();
      const alunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{id: string, nome?: string, turma?: string}>;
      
      const refeicoesRef = adminDb.collection('refeicoes');
      
      // ----> USA dataFormatada (DIA ANTERIOR) PARA DEFINIR INTERVALO <----
      // Usar UTC para evitar problemas de fuso horário na query do Firestore
      const inicioDiaAnteriorUTC = new Date(dataFormatada + 'T00:00:00.000Z');
      const fimDiaAnteriorUTC = new Date(dataFormatada + 'T23:59:59.999Z');
      const dataInicio = Timestamp.fromDate(inicioDiaAnteriorUTC);
      const dataFim = Timestamp.fromDate(fimDiaAnteriorUTC);
      // const dataInicio = new Date(dataFormatada); dataInicio.setHours(0, 0, 0, 0);
      // const dataFim = new Date(dataFormatada); dataFim.setHours(23, 59, 59, 999);
      
      console.log(`[API /agendar-relatorio] Buscando refeições entre ${inicioDiaAnteriorUTC.toISOString()} e ${fimDiaAnteriorUTC.toISOString()}`);

      const refeicoesQuery = refeicoesRef
        // .where('data', '>=', Timestamp.fromDate(dataInicio)) // Versão antiga
        // .where('data', '<', Timestamp.fromDate(dataFim)); // Versão antiga
        .where('data', '>=', dataInicio) // Usando Timestamps UTC
        .where('data', '<=', dataFim); // Usando Timestamps UTC (<= fim do dia)
      
      const refeicoesSnapshot = await refeicoesQuery.get();
      const refeicoes = refeicoesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          alunoId: data.alunoId,
          nomeAluno: data.nomeAluno || '',
          turma: data.turma || '',
          tipo: data.tipo || 'ALMOCO',
          data: (data.data as admin.firestore.Timestamp)?.toDate() ?? new Date()
        };
      });
      
      const alunosQueComeram = new Set(refeicoes.map(r => r.alunoId));
      
      const alunosComeram = alunos
        .filter(aluno => alunosQueComeram.has(aluno.id))
        .map(aluno => ({ nome: aluno.nome || 'Sem nome', turma: aluno.turma || 'Sem turma' }));
      
      const alunosNaoComeram = alunos
        .filter(aluno => !alunosQueComeram.has(aluno.id))
        .map(aluno => ({ nome: aluno.nome || 'Sem nome', turma: aluno.turma || 'Sem turma' }));
      
      const refeicoesPorTipo: Record<string, number> = {};
      refeicoes.forEach(refeicao => {
        const tipoFormatado = formatarTipoRefeicao(refeicao.tipo);
        refeicoesPorTipo[tipoFormatado] = (refeicoesPorTipo[tipoFormatado] || 0) + 1;
      });
      
      const refeicoesFormatadas = refeicoes.map(refeicao => ({
        alunoId: refeicao.alunoId,
        nomeAluno: refeicao.nomeAluno,
        turma: refeicao.turma,
        tipo: formatarTipoRefeicao(refeicao.tipo),
        data: refeicao.data
      }));
      
      const dadosRelatorio = {
        data: dataFormatada, // <-- Usa data do dia anterior
        totalAlunos: alunos.length,
        totalComeram: alunosComeram.length,
        totalNaoComeram: alunosNaoComeram.length,
        alunosComeram,
        alunosNaoComeram,
        refeicoesPorTipo,
        refeicoes: refeicoesFormatadas
      };
      
      await enviarRelatorioDiario(dadosRelatorio, emailsDestino); 
      
      return NextResponse.json({
        success: true,
        message: `Relatório para ${dataFormatada} enviado com sucesso`,
        data: {
          dataRelatorio: dataFormatada,
          totalAlunos: alunos.length,
          totalComeram: alunosComeram.length,
          totalNaoComeram: alunosNaoComeram.length
        }
      });
    } catch (dbError: any) {
      console.error('Erro ao buscar dados no Firestore ou gerar relatório:', dbError);
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
