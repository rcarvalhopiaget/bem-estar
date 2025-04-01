import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import { iniciarAgendadorRelatorios } from '@/lib/scheduler/reportScheduler';

async function startWorker() {
  console.log('[Worker] Iniciando processo worker...');
  try {
    // Inicializar o Firebase Admin uma vez para o worker
    // A função initializeFirebaseAdmin já deve lidar com múltiplas inicializações
    initializeFirebaseAdmin(); 
    console.log('[Worker] Firebase Admin inicializado.');

    // Iniciar o agendador de relatórios
    iniciarAgendadorRelatorios();
    console.log('[Worker] Agendador de relatórios iniciado.');

    // Manter o worker rodando (pode ser necessário em algumas configurações)
    console.log('[Worker] Processo worker iniciado e aguardando tarefas agendadas...');
    // Se o processo terminar imediatamente, pode ser necessário mantê-lo vivo.
    // Uma forma simples é uma promessa que nunca resolve:
    // await new Promise(() => {}); 
    // Ou verificar se o node-cron mantém o processo vivo por si só.

  } catch (error) {
    console.error('[Worker] Erro fatal ao iniciar o worker:', error);
    process.exit(1); // Terminar com erro se a inicialização falhar
  }
}

startWorker(); 