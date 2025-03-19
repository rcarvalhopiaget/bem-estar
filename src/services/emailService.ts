import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';

// Flag para habilitar o modo de simulação (sem chamar as Cloud Functions)
const MODO_SIMULACAO = true;

const functionsInstance = getFunctions();

interface EmailConfig {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

// Armazena a configuração de envio em memória (para simulação)
let configuracaoSimulada = {
  email: '',
  horario: '18:00',
  ativo: false
};

/**
 * Envia um email usando Firebase Cloud Functions
 * @param config Configuração do email a ser enviado
 * @returns Promise que resolve quando o email é enviado
 */
export const sendEmail = async (config: EmailConfig): Promise<void> => {
  if (MODO_SIMULACAO) {
    console.log('Simulando envio de email:', config);
    // Simula um pequeno atraso para parecer que está enviando
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  }

  try {
    const sendEmailFunction = httpsCallable(functionsInstance, 'sendEmail');
    await sendEmailFunction(config);
    return Promise.resolve();
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    toast.error('Erro ao enviar email. Tente novamente.');
    return Promise.reject(error);
  }
};

/**
 * Envia um relatório por email
 * @param email Email do destinatário
 * @param assunto Assunto do email
 * @param conteudoHTML Conteúdo HTML do email
 * @param anexoCSV Conteúdo do arquivo CSV para anexar
 * @returns Promise que resolve quando o email é enviado
 */
export const enviarRelatorioEmail = async (
  email: string,
  assunto: string,
  conteudoHTML: string,
  anexoCSV?: string
): Promise<void> => {
  try {
    const config: EmailConfig = {
      to: email,
      subject: assunto,
      html: conteudoHTML,
    };

    if (anexoCSV) {
      config.attachments = [
        {
          filename: `relatorio-refeicoes.csv`,
          content: anexoCSV,
          contentType: 'text/csv',
        },
      ];
    }

    await sendEmail(config);
    toast.success('Relatório enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
    toast.error('Erro ao enviar relatório por email. Tente novamente.');
    throw error;
  }
};

/**
 * Salva a configuração de envio automático de relatório
 * @param email Email do destinatário
 * @param horario Horário para envio do relatório
 * @param ativo Se o envio automático está ativo
 * @returns Promise que resolve quando a configuração é salva
 */
export const salvarConfiguracaoEnvioRelatorio = async (
  email: string,
  horario: string,
  ativo: boolean
): Promise<void> => {
  if (MODO_SIMULACAO) {
    console.log('Simulando salvamento de configuração:', { email, horario, ativo });
    configuracaoSimulada = { email, horario, ativo };
    // Simula um pequeno atraso para parecer que está salvando
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Configuração de envio salva com sucesso!');
    return Promise.resolve();
  }

  try {
    const saveConfigFunction = httpsCallable(functionsInstance, 'saveReportConfig');
    await saveConfigFunction({ email, horario, ativo });
    toast.success('Configuração de envio salva com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configuração de envio:', error);
    toast.error('Erro ao salvar configuração. Tente novamente.');
    throw error;
  }
};

/**
 * Obtém a configuração de envio automático de relatório
 * @returns Promise que resolve com a configuração de envio
 */
export const obterConfiguracaoEnvioRelatorio = async (): Promise<{
  email: string;
  horario: string;
  ativo: boolean;
}> => {
  if (MODO_SIMULACAO) {
    console.log('Simulando obtenção de configuração, retornando:', configuracaoSimulada);
    // Simula um pequeno atraso para parecer que está buscando
    await new Promise(resolve => setTimeout(resolve, 300));
    return configuracaoSimulada;
  }

  try {
    const getConfigFunction = httpsCallable(functionsInstance, 'getReportConfig');
    const result = await getConfigFunction();
    return result.data as { email: string; horario: string; ativo: boolean };
  } catch (error) {
    console.error('Erro ao obter configuração de envio:', error);
    toast.error('Erro ao obter configuração. Usando valores padrão.');
    return {
      email: '',
      horario: '18:00',
      ativo: false,
    };
  }
};
