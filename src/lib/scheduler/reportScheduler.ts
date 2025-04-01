import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { enviarRelatorioDiario, RelatorioData } from '@/services/emailService.server';
import { emailConfig } from '@/config/email.config';

const MODO_SIMULACAO = emailConfig.testMode;

function formatarTipoRefeicao(tipo: string): string {
  switch (tipo?.toUpperCase()) {
    case 'ALMOCO':
      return 'Almoço';
    case 'LANCHE_MANHA':
      return 'Lanche da Manhã';
    case 'LANCHE_TARDE':
      return 'Lanche da Tarde';
    case 'SOPA': // Adicionar outros tipos se existirem
        return 'Sopa';
    default:
      return tipo || 'Desconhecido';
  }
}

export async function executarEnvioRelatorioUnico() {
  try {
    const adminApp = initializeFirebaseAdmin();
    const adminDb = admin.firestore(adminApp);
    const Timestamp = admin.firestore.Timestamp;

    // --- Buscar Configuração de Envio ---
    let emailsDestino: string[] = [];
    let configuracaoAtiva = true;
    let horarioConfigurado = '18:00'; // Horário padrão

    try {
      const configDoc = await adminDb.collection('configuracoes').doc('envioRelatorio').get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        configuracaoAtiva = configData?.ativo ?? true;
        emailsDestino = Array.isArray(configData?.emails)
                        ? configData.emails.filter((e: any) => typeof e === 'string' && e.trim() !== '')
                        : [];
        if (configData?.horario && typeof configData.horario === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(configData.horario)) {
           horarioConfigurado = configData.horario;
        } else {
           console.warn(`[Scheduler] Horário inválido ou ausente na configuração (${configData?.horario}), usando padrão 18:00.`);
           horarioConfigurado = '18:00';
        }

      } else {
        console.warn('[Scheduler] Documento de configuração envioRelatorio não encontrado, usando padrão e desativando.');
        configuracaoAtiva = false; // Desativar se config não existe
        horarioConfigurado = '18:00'; // Definir padrão mesmo desativado
      }

      if (!configuracaoAtiva) {
        console.log('[Scheduler] Envio de relatórios está desativado nas configurações.');
        return; // Sai da função se estiver inativo
      }
      if (emailsDestino.length === 0) {
         console.warn('[Scheduler] Nenhum email de destino configurado.');
         return; // Sai se não há emails
      }
    } catch (configError: any) {
       console.error('[Scheduler] Erro ao obter configuração de envio:', configError);
       return; // Não continuar se houver erro na config
    }
    // --- Fim Buscar Configuração ---

    console.log('[CronTask] Iniciando geração de relatório...');

    const dataRelatorio = new Date();
    dataRelatorio.setDate(dataRelatorio.getDate() - 1);
    const dataFormatada = dataRelatorio.toISOString().split('T')[0];
    const usarSimulacao = MODO_SIMULACAO;

    console.log(`[CronTask] Gerando relatório para ${dataFormatada}. Modo Simulação: ${usarSimulacao}`);

    if (usarSimulacao) {
      console.log('[CronTask] [SIMULAÇÃO] Gerando relatório simulado...');
      const dadosSimulados: RelatorioData = {
        data: dataFormatada,
        totalAlunos: 5,
        totalComeram: 3,
        totalNaoComeram: 2,
        alunosComeram: [
          { nome: 'Aluno Simulado A', turma: 'Turma 1' },
          { nome: 'Aluno Simulado B', turma: 'Turma 1' },
          { nome: 'Aluno Simulado C', turma: 'Turma 2' },
        ],
        alunosNaoComeram: [
          { nome: 'Aluno Simulado D', turma: 'Turma 2' },
          { nome: 'Aluno Simulado E', turma: 'Turma 1' },
        ],
        refeicoesPorTipo: {
          'Almoço': 2,
          'Lanche da Manhã': 1,
        },
        refeicoes: [
          { alunoId: 'sim-a', nomeAluno: 'Aluno Simulado A', turma: 'Turma 1', tipo: 'Almoço', data: new Date() },
          { alunoId: 'sim-b', nomeAluno: 'Aluno Simulado B', turma: 'Turma 1', tipo: 'Lanche da Manhã', data: new Date() },
          { alunoId: 'sim-c', nomeAluno: 'Aluno Simulado C', turma: 'Turma 2', tipo: 'Almoço', data: new Date() },
        ]
      };
      await enviarRelatorioDiario(dadosSimulados, emailsDestino);
      console.log('[CronTask] [SIMULAÇÃO] Relatório simulado enviado.');

    } else {
       console.log('[CronTask] Buscando dados reais do Firestore...');
       const inicioDiaAnterior = new Date(dataFormatada + 'T00:00:00.000-03:00');
       const fimDiaAnterior = new Date(dataFormatada + 'T23:59:59.999-03:00');
       const inicioTimestamp = Timestamp.fromDate(inicioDiaAnterior);
       const fimTimestamp = Timestamp.fromDate(fimDiaAnterior);

       const alunosSnapshot = await adminDb.collection('alunos').where('ativo', '==', true).get();
       const alunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as { nome?: string, turma?: string }) }));

       const refeicoesSnapshot = await adminDb.collectionGroup('refeicoes')
         .where('data', '>=', inicioTimestamp)
         .where('data', '<=', fimTimestamp)
         .get();

       const refeicoes = refeicoesSnapshot.docs.map(doc => {
          const data = doc.data();
          const refeicaoData = (data.data as admin.firestore.Timestamp)?.toDate() ?? new Date();
          return {
             id: doc.id,
             alunoId: data.alunoId ?? 'desconhecido',
             nomeAluno: data.nomeAluno ?? 'Nome não encontrado',
             turma: data.turma ?? 'Turma não encontrada',
             tipo: data.tipo ?? 'DESCONHECIDO', 
             data: refeicaoData
          };
       });

       console.log(`[CronTask] Encontrados ${alunos.length} alunos ativos e ${refeicoes.length} refeições para ${dataFormatada}.`);

       const alunosComeramIds = new Set(refeicoes.map(r => r.alunoId));
       const alunosComeram = alunos
         .filter(a => alunosComeramIds.has(a.id))
         .map(a => ({ nome: a.nome || 'Sem nome', turma: a.turma || 'Sem turma' }));
       const alunosNaoComeram = alunos
         .filter(a => !alunosComeramIds.has(a.id))
         .map(a => ({ nome: a.nome || 'Sem nome', turma: a.turma || 'Sem turma' }));

       const refeicoesPorTipo: { [key: string]: number } = {};
       refeicoes.forEach(refeicao => {
          const tipoFormatado = formatarTipoRefeicao(refeicao.tipo);
          refeicoesPorTipo[tipoFormatado] = (refeicoesPorTipo[tipoFormatado] || 0) + 1;
       });

       const refeicoesParaRelatorio = refeicoes.map(r => ({ 
          alunoId: r.alunoId,
          nomeAluno: r.nomeAluno,
          turma: r.turma,
          tipo: formatarTipoRefeicao(r.tipo),
          data: r.data 
       }));

       const dadosRelatorio: RelatorioData = {
         data: dataFormatada,
         totalAlunos: alunos.length,
         totalComeram: alunosComeram.length,
         totalNaoComeram: alunosNaoComeram.length,
         alunosComeram,
         alunosNaoComeram,
         refeicoesPorTipo,
         refeicoes: refeicoesParaRelatorio
       };

       await enviarRelatorioDiario(dadosRelatorio, emailsDestino);
       console.log(`[CronTask] Relatório real para ${dataFormatada} enviado para ${emailsDestino.join(', ')}.`);
    }

  } catch (error) {
    console.error('[CronTask] Erro ao executar a tarefa de envio de relatório:', error);
    throw error;
  }
} 