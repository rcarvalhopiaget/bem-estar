import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
// Vamos renomear a função do scheduler para clareza
import { executarEnvioRelatorioUnico } from '@/lib/scheduler/reportScheduler'; // Precisamos criar/renomear esta função

async function runReportTask() {
  console.log('[CronJob] Iniciando tarefa de envio de relatório...');
  try {
    // Inicializar Firebase Admin
    initializeFirebaseAdmin(); 
    console.log('[CronJob] Firebase Admin inicializado.');

    // Executar a lógica de envio do relatório diretamente
    await executarEnvioRelatorioUnico(); // Chama a função que contém a lógica
    console.log('[CronJob] Tarefa de envio de relatório concluída com sucesso.');
    
    // O processo deve encerrar automaticamente aqui se não houver mais operações pendentes
    // Se necessário, podemos forçar a saída (mas geralmente não é preciso se o async/await for gerenciado corretamente)
    // process.exit(0); 

  } catch (error) {
    console.error('[CronJob] Erro fatal durante a execução da tarefa de relatório:', error);
    process.exit(1); // Terminar com erro
  }
}

// Executa a tarefa imediatamente quando o script é chamado
runReportTask(); 