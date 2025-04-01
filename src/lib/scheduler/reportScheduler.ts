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

    // --- Buscar Configuração de Envio (incluindo horário) ---
    let emailsDestino: string[] = [];
    let configuracaoAtiva = true;
    let horarioConfigurado = '18:00'; // Horário padrão caso não encontrado

    try {
      const configDoc = await adminDb.collection('configuracoes').doc('envioRelatorio').get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        configuracaoAtiva = configData?.ativo ?? true;
        emailsDestino = Array.isArray(configData?.emails)
                        ? configData.emails.filter((e: any) => typeof e === 'string' && e.trim() !== '')
                        : [];
        // Pega o horário configurado, validando o formato HH:MM
        if (configData?.horario && typeof configData.horario === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(configData.horario)) {
           horarioConfigurado = configData.horario;
           console.log(`[CronTask] Horário configurado encontrado: ${horarioConfigurado}`);
        } else {
           console.warn(`[CronTask] Horário inválido ou ausente na configuração (${configData?.horario}), usando padrão ${horarioConfigurado}.`);
        }
      } else {
        console.warn('[CronTask] Documento de configuração envioRelatorio não encontrado. Tarefa não será executada.');
        configuracaoAtiva = false;
      }

      if (!configuracaoAtiva) {
        // console.log('[CronTask] Envio de relatórios está desativado nas configurações.'); // Log menos verboso
        return; 
      }
      if (emailsDestino.length === 0) {
         // console.warn('[CronTask] Nenhum email de destino configurado.'); // Log menos verboso
         return; 
      }
    } catch (configError: any) {
       console.error('[CronTask] Erro ao obter configuração de envio:', configError);
       return; 
    }
    // --- Fim Buscar Configuração ---

    // ---> REINTRODUZIR A VERIFICAÇÃO DE HORÁRIO <--- 
    const agora = new Date();
    // Obter hora atual no fuso horário correto (ex: São Paulo)
    const horaAtualFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'America/Sao_Paulo' 
    });

    // Compara a hora atual (HH:MM) com a hora configurada no Firestore
    if (horaAtualFormatada !== horarioConfigurado) {
        // Log apenas para depuração, pode ser removido ou comentado em produção
        // console.log(`[CronTask] Horário atual (${horaAtualFormatada}) não corresponde ao configurado (${horarioConfigurado}). Pulando execução.`);
        return; // Sai silenciosamente se não for a hora
    }
    
    // Se chegou aqui, é a hora configurada!
    console.log(`[CronTask] Horário (${horaAtualFormatada}) corresponde ao configurado (${horarioConfigurado}). Iniciando geração de relatório...`);

    // --- Lógica de Geração e Envio (mantida como antes) ---
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