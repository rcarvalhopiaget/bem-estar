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

    // CALCULAR A DATA DO DIA ATUAL (em vez de anterior)
    const hoje = new Date();
    const dataRelatorio = new Date(hoje); 
    
    // Formatar a data do dia atual como YYYY-MM-DD
    const dataFormatada = dataRelatorio.toISOString().split('T')[0]; 
    console.log(`[API /agendar-relatorio] Iniciando geração para data: ${dataFormatada}`);

    const usarSimulacao = MODO_SIMULACAO; 
    
    if (usarSimulacao) {
      console.log(`[API /agendar-relatorio] [SIMULAÇÃO] Gerando relatório simulado para ${dataFormatada}`);
      
      // Obtém o dia da semana da data do relatório (0: Domingo, 1: Segunda, ..., 6: Sábado)
      const diaSemana = new Date(dataFormatada).getDay();
      
      // Adaptando os dados simulados para refletir a lógica de "alunos que deveriam comer"
      // Vamos simular 50 alunos totais, mas apenas alguns deveriam comer no dia
      const totalAlunosSimulados = 50;
      const totalAlunosQueDeveriam = diaSemana >= 1 && diaSemana <= 5 ? 30 : 10; // Menos alunos nos fins de semana
      const totalComeram = Math.floor(totalAlunosQueDeveriam * 0.7); // 70% dos que deveriam, comeram
      const totalNaoComeram = totalAlunosQueDeveriam - totalComeram; // 30% dos que deveriam, não comeram
      
      const dadosSimulados = {
        data: dataFormatada,
        totalAlunos: totalAlunosQueDeveriam, // Agora é o total de quem deveria comer
        totalComeram: totalComeram,
        totalNaoComeram: totalNaoComeram,
        alunosComeram: Array(totalComeram).fill(0).map((_, i) => ({ 
          nome: `Aluno Simulado ${i+1}`, 
          turma: `Turma ${Math.floor(i/10) + 1}` 
        })),
        alunosNaoComeram: Array(totalNaoComeram).fill(0).map((_, i) => ({ 
          nome: `Aluno Não Comeu ${i+1}`, 
          turma: `Turma ${Math.floor(i/5) + 1}` 
        })),
        refeicoesPorTipo: {
          'Almoço': Math.floor(totalComeram * 0.6),
          'Lanche da Manhã': Math.floor(totalComeram * 0.2),
          'Lanche da Tarde': Math.floor(totalComeram * 0.2)
        },
        refeicoes: Array(totalComeram).fill(0).map((_, i) => {
          const tiposRefeicao = ['Almoço', 'Lanche da Manhã', 'Lanche da Tarde'];
          const tipo = tiposRefeicao[Math.floor(Math.random() * tiposRefeicao.length)];
          const hora = tipo === 'Almoço' ? 12 : (tipo === 'Lanche da Manhã' ? 9 : 15);
          const dataRefeicaoSimulada = new Date(dataFormatada);
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
        message: `[SIMULAÇÃO] Relatório simulado para ${dataFormatada} enviado com sucesso. Mostrando apenas alunos que deveriam comer.`,
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
      const alunos = alunosSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Array<{
        id: string, 
        nome?: string, 
        turma?: string, 
        tipo?: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO',
        diasRefeicaoPermitidos?: number[],
        ativo?: boolean
      }>;
      
      const refeicoesRef = adminDb.collection('refeicoes');
      
      // ----> USA dataFormatada (DIA ATUAL) PARA DEFINIR INTERVALO <----
      // Usar UTC para evitar problemas de fuso horário na query do Firestore
      const inicioDiaAtualUTC = new Date(dataFormatada + 'T00:00:00.000Z'); // Renomeado para clareza
      const fimDiaAtualUTC = new Date(dataFormatada + 'T23:59:59.999Z'); // Renomeado para clareza
      const dataInicio = Timestamp.fromDate(inicioDiaAtualUTC);
      const dataFim = Timestamp.fromDate(fimDiaAtualUTC);
      
      console.log(`[API /agendar-relatorio] Buscando refeições entre ${inicioDiaAtualUTC.toISOString()} e ${fimDiaAtualUTC.toISOString()}`);

      const refeicoesQuery = refeicoesRef
        .where('data', '>=', dataInicio) 
        .where('data', '<=', dataFim); 
      
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
      
      // Obtém o dia da semana da data do relatório (0: Domingo, 1: Segunda, ..., 6: Sábado)
      const diaSemana = inicioDiaAtualUTC.getDay();
      
      // Função para verificar se um aluno deve comer no dia específico
      const alunoDeveComer = (aluno: { 
        tipo?: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO', 
        diasRefeicaoPermitidos?: number[],
        ativo?: boolean
      }) => {
        // Primeiro verificamos se o aluno está ativo
        if (aluno.ativo === false) {
          return false;
        }
        
        // Alunos MENSALISTA ou INTEGRAL_5X sempre devem comer em dias úteis
        if (aluno.tipo === 'MENSALISTA' || aluno.tipo === 'INTEGRAL_5X') {
          return diaSemana >= 1 && diaSemana <= 5; // Segunda a sexta
        }
        
        // Se tem dias específicos permitidos, verifica se o dia atual está na lista
        if (aluno.diasRefeicaoPermitidos && Array.isArray(aluno.diasRefeicaoPermitidos)) {
          return aluno.diasRefeicaoPermitidos.includes(diaSemana);
        }
        
        // Para tipos INTEGRAL_4X, INTEGRAL_3X, INTEGRAL_2X, SEMI_INTEGRAL, ESTENDIDO
        // consideramos apenas dias úteis (segunda a sexta)
        if (diaSemana >= 1 && diaSemana <= 5) {
          if (['INTEGRAL_4X', 'INTEGRAL_3X', 'INTEGRAL_2X', 'SEMI_INTEGRAL', 'ESTENDIDO'].includes(aluno.tipo || '')) {
            return true;
          }
        }
        
        // AVULSO não tem dias fixos, então não contabilizamos como "deveria comer"
        return false;
      };
      
      // Filtra apenas alunos que deveriam comer neste dia
      const alunosQueDeveriam = alunos.filter(alunoDeveComer);
      
      const alunosQueComeram = new Set(refeicoes.map(r => r.alunoId));
      
      // Alunos que deveriam comer e comeram
      const alunosComeram = alunosQueDeveriam
        .filter(aluno => alunosQueComeram.has(aluno.id))
        .map(aluno => ({ nome: aluno.nome || 'Sem nome', turma: aluno.turma || 'Sem turma' }));
      
      // Alunos que deveriam comer mas não comeram
      const alunosNaoComeram = alunosQueDeveriam
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
      
      console.log(`[API /agendar-relatorio] Alunos que deveriam comer: ${alunosQueDeveriam.length}, Comeram: ${alunosComeram.length}, Não comeram: ${alunosNaoComeram.length}`);
      
      const dadosRelatorio = {
        data: dataFormatada, // <-- Usa data do dia atual
        totalAlunos: alunosQueDeveriam.length,
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
          totalAlunos: alunosQueDeveriam.length,
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
