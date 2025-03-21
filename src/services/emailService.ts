import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendEmailWithEmailJS } from '@/components/EmailJSInit';
import { emailConfig } from '@/config/email.config';

// Constantes de configuração
const MODO_SIMULACAO = process.env.NODE_ENV === 'development' && emailConfig.testMode;
const USAR_EMAILJS = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? true : false;
const USAR_API_LOCAL = !USAR_EMAILJS;

// Obtém a instância do Firebase Functions
const functionsInstance = getFunctions();

interface EmailConfig {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Envia um email com os dados fornecidos
 * @param config Configuração do email
 * @returns Promise que resolve quando o email for enviado
 */
export const enviarEmail = async (config: EmailConfig): Promise<void> => {
  if (!config.to || !config.subject) {
    return Promise.reject(new Error('Destinatário e assunto são obrigatórios'));
  }

  if (MODO_SIMULACAO) {
    console.log('[SIMULAÇÃO] Enviando email:', config);
    return Promise.resolve();
  }

  // Usar EmailJS se disponível
  if (USAR_EMAILJS) {
    try {
      const result = await sendEmailWithEmailJS(
        config.to, 
        config.subject, 
        config.html || config.text || ''
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao enviar email via EmailJS:', error);
      return Promise.reject(error);
    }
  }

  if (USAR_API_LOCAL) {
    // Usando API local
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/enviar-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destinatario: config.to,
          assunto: config.subject,
          texto: config.text,
          html: config.html,
          anexos: config.attachments
        })
      });

      if (response.ok) {
        console.log('Email enviado com sucesso via API local');
        return Promise.resolve();
      } else {
        const data = await response.json();
        console.error('Erro ao enviar email via API local:', data.message);
        return Promise.reject(new Error(`Erro ao enviar email: ${data.message}`));
      }
    } catch (error: any) {
      console.error('Erro ao enviar email via API local:', error);
      return Promise.reject(error);
    }
  }

  try {
    // Usar Cloud Functions (caso não esteja usando API local ou EmailJS)
    const sendEmail = httpsCallable(functionsInstance, 'sendEmail');
    const result = await sendEmail(config);
    
    return Promise.resolve();
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
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
        },
      ];
    }

    await enviarEmail(config);
    console.log('Relatório enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
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
  try {
    // Tentar obter a configuração do Firestore diretamente
    const configRef = doc(db, 'configuracoes', 'relatorios');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      return {
        email: data.email || 'bemestar@jpiaget.com.br',
        horario: data.horario || '18:00',
        ativo: data.ativo !== undefined ? data.ativo : true,
      };
    }
    
    // Se não existir, retornar configuração padrão
    return getDefaultConfig();
  } catch (error: any) {
    // Em caso de erro de permissão, apenas retorna a configuração padrão sem mostrar erro
    if (error?.code === 'permission-denied') {
      return getDefaultConfig();
    }
    
    // Para outros tipos de erro, registra no console
    console.error('Erro ao obter configuração de envio:', error);
    return getDefaultConfig();
  }
};

// Função auxiliar para retornar a configuração padrão
const getDefaultConfig = () => {
  return {
    email: 'bemestar@jpiaget.com.br',
    horario: '18:00',
    ativo: true,
  };
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
  try {
    // Salvar diretamente no Firestore
    const configRef = doc(db, 'configuracoes', 'relatorios');
    await setDoc(configRef, {
      email,
      horario,
      ativo,
      atualizadoEm: new Date()
    }, { merge: true });
    
    console.log('Configuração de envio salva com sucesso!');
  } catch (error: any) {
    // Tratamento específico para erro de permissão
    if (error?.code === 'permission-denied') {
      console.log('Sem permissão para salvar configurações. Usando modo simulação.');
      // Simula sucesso em ambiente de desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Configuração salva em modo simulação');
        return;
      }
    }
    
    console.error('Erro ao salvar configuração de envio:', error);
    throw error;
  }
};

/**
 * Envia um email de teste para o endereço configurado
 * @param minutosAtraso Atraso em minutos para envio do email (padrão: 5 minutos)
 * @returns Objeto com informações do resultado
 */
export const enviarEmailTeste = async (minutosAtraso: number = 0): Promise<{ success: boolean, message: string, horarioEnvio?: string, previewUrl?: string }> => {
  try {
    // Obter configuração de email
    const config = await obterConfiguracaoEnvioRelatorio();
    
    if (!config.email) {
      return { 
        success: false, 
        message: 'Nenhum email configurado para receber relatórios' 
      };
    }

    // Calcular o horário de envio
    const agora = new Date();
    const horarioEnvio = new Date(agora.getTime() + minutosAtraso * 60 * 1000);
    const horarioFormatado = horarioEnvio.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Se estiver em modo de desenvolvimento ou simulação, apenas simular o envio
    if (process.env.NODE_ENV === 'development' || MODO_SIMULACAO) {
      console.log(`[SIMULAÇÃO] Email de teste será enviado para ${config.email} às ${horarioFormatado}`);
      
      // Simular envio após o atraso especificado
      if (minutosAtraso > 0) {
        setTimeout(() => {
          console.log(`[SIMULAÇÃO] Email de teste enviado para ${config.email}`);
        }, minutosAtraso * 60 * 1000);
      }
      
      return {
        success: true,
        message: `Email de teste será enviado para ${config.email} ${minutosAtraso > 0 ? `às ${horarioFormatado}` : 'em instantes'}`,
        horarioEnvio: horarioFormatado,
        previewUrl: '/api/preview-email?tipo=teste'
      };
    }

    // Usar API para enviar o email
    if (USAR_API_LOCAL) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        // Fazer a chamada para a API local
        const response = await fetch(`${baseUrl}/api/enviar-teste`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: `Email de teste será enviado para ${config.email} ${minutosAtraso > 0 ? `às ${horarioFormatado}` : 'em instantes'}`,
            horarioEnvio: horarioFormatado,
            previewUrl: '/api/preview-email?tipo=teste'
          };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            message: `Erro ao agendar envio: ${errorData.error || 'Erro desconhecido'}`
          };
        }
      } catch (error: any) {
        console.error('Erro ao chamar API de teste:', error);
        return {
          success: false,
          message: `Erro ao agendar envio: ${error.message || 'Erro desconhecido'}`
        };
      }
    }

    // Usar Cloud Functions (caso não esteja usando API local)
    try {
      const sendEmailTest = httpsCallable(functionsInstance, 'sendEmailTest');
      const result = await sendEmailTest({ 
        email: config.email,
        delayMinutes: minutosAtraso
      });
      
      return {
        success: true,
        message: `Email de teste será enviado para ${config.email} ${minutosAtraso > 0 ? `às ${horarioFormatado}` : 'em instantes'}`,
        horarioEnvio: horarioFormatado
      };
    } catch (error: any) {
      console.error('Erro ao chamar Cloud Function:', error);
      return {
        success: false,
        message: `Erro ao agendar envio: ${error.message || 'Erro desconhecido'}`
      };
    }
  } catch (error: any) {
    // Se for erro de permissão, retorna mensagem amigável
    if (error?.code === 'permission-denied') {
      console.log('Sem permissão para enviar email de teste. Usando modo simulação.');
      
      const horarioEnvioSimulado = new Date();
      horarioEnvioSimulado.setMinutes(horarioEnvioSimulado.getMinutes() + minutosAtraso);
      const horarioFormatadoSimulado = horarioEnvioSimulado.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return {
        success: true,
        message: `[SIMULAÇÃO] Email de teste será enviado ${minutosAtraso > 0 ? `às ${horarioFormatadoSimulado}` : 'em instantes'}`,
        horarioEnvio: horarioFormatadoSimulado,
        previewUrl: '/api/preview-email?tipo=teste'
      };
    }
    
    console.error('Erro ao enviar email de teste:', error);
    return {
      success: false,
      message: `Erro ao enviar email de teste: ${error.message || 'Erro desconhecido'}`
    };
  }
};

/**
 * Envia um relatório diário de refeições por email
 * @param data Dados do relatório
 * @returns Promise que resolve quando o relatório for enviado
 */
export const enviarRelatorioDiario = async (data: {
  data: string;
  totalAlunos: number;
  totalComeram: number;
  totalNaoComeram: number;
  alunosComeram: Array<{ nome: string; turma: string }>;
  alunosNaoComeram: Array<{ nome: string; turma: string }>;
}): Promise<void> => {
  try {
    // Obter configuração de email
    const config = await obterConfiguracaoEnvioRelatorio();
    
    if (!config.email || !config.ativo) {
      console.log('Envio de relatório não configurado ou desativado');
      return;
    }
    
    // Formatar a data para exibição
    const dataFormatada = new Date(data.data).toLocaleDateString('pt-BR');
    
    // Calcular percentual de alunos que comeram
    const percentualComeram = Math.round((data.totalComeram / data.totalAlunos) * 100) || 0;
    
    // Gerar tabela HTML com alunos que comeram
    let tabelaComeram = '';
    if (data.alunosComeram.length > 0) {
      tabelaComeram = `
        <h3 style="color: #4CAF50;">Alunos que comeram (${data.totalComeram})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Nome</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Turma</th>
            </tr>
          </thead>
          <tbody>
            ${data.alunosComeram.map(aluno => `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${aluno.nome}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${aluno.turma}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Gerar tabela HTML com alunos que não comeram
    let tabelaNaoComeram = '';
    if (data.alunosNaoComeram.length > 0) {
      tabelaNaoComeram = `
        <h3 style="color: #F44336;">Alunos que não comeram (${data.totalNaoComeram})</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Nome</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Turma</th>
            </tr>
          </thead>
          <tbody>
            ${data.alunosNaoComeram.map(aluno => `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${aluno.nome}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${aluno.turma}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Gerar conteúdo HTML do email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #333;">Relatório de Refeições - ${dataFormatada}</h1>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2>Resumo</h2>
          <p><strong>Total de alunos:</strong> ${data.totalAlunos}</p>
          <p><strong>Alunos que comeram:</strong> ${data.totalComeram} (${percentualComeram}%)</p>
          <p><strong>Alunos que não comeram:</strong> ${data.totalNaoComeram} (${100 - percentualComeram}%)</p>
        </div>
        
        ${tabelaComeram}
        
        ${tabelaNaoComeram}
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
          <p>Este relatório foi gerado automaticamente pelo Sistema Bem-Estar.</p>
          <p>Data e hora de geração: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `;
    
    // Gerar conteúdo CSV para anexo
    let csvContent = 'Nome,Turma,Status\n';
    
    // Adicionar alunos que comeram
    data.alunosComeram.forEach(aluno => {
      csvContent += `${aluno.nome},${aluno.turma},Comeu\n`;
    });
    
    // Adicionar alunos que não comeram
    data.alunosNaoComeram.forEach(aluno => {
      csvContent += `${aluno.nome},${aluno.turma},Não comeu\n`;
    });
    
    // Configurar email
    const emailConfig = {
      to: config.email,
      subject: `Relatório de Refeições - ${dataFormatada}`,
      html: htmlContent,
      attachments: [
        {
          filename: `relatorio-refeicoes-${dataFormatada.replace(/\//g, '-')}.csv`,
          content: csvContent
        }
      ]
    };
    
    // Enviar email
    await enviarEmail(emailConfig);
    console.log(`Relatório de refeições enviado com sucesso para ${config.email}`);
    
  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
    throw error;
  }
};
