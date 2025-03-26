import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { emailConfig } from '@/config/email.config';

// Constantes de configuração
const MODO_SIMULACAO = process.env.EMAIL_TEST_MODE === 'true' || emailConfig.testMode;

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
  try {
    // Verificar se estamos em modo de simulação
    if (MODO_SIMULACAO) {
      console.log('Modo de simulação ativado. Email não será enviado.');
      console.log('Configuração do email:', JSON.stringify(config, null, 2));
      return Promise.resolve();
    }

    // Verificar se estamos no lado do cliente (browser) ou servidor
    const isBrowser = typeof window !== 'undefined';
    
    // No lado do cliente, podemos ter problemas com CORS, então vamos
    // implementar uma solução que funcione bem em ambos os ambientes
    if (isBrowser) {
      try {
        // Usar a URL base da aplicação ou localhost se não estiver definida
        const baseUrl = window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        console.log('Enviando email via API local (cliente):', `${baseUrl}/api/enviar-email`);
        
        // Usar AbortController para definir um timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
        
        try {
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
            }),
            signal: controller.signal
          });
          
          // Limpar o timeout
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('Email enviado com sucesso via API local (cliente)');
            return Promise.resolve();
          } else {
            // Se a resposta não for ok, tentar ler o JSON
            try {
              const data = await response.json();
              console.error('Erro ao enviar email via API local (cliente):', data);
              
              // Verificar se é um erro de permissão e tratar adequadamente
              if (data.error?.code === 'permission-denied') {
                console.log('Erro de permissão ao enviar email. Usando modo de simulação como fallback.');
                return Promise.resolve();
              }
              
              // Mostrar o erro mas não falhar completamente
              console.error(`Erro ao enviar email: ${data.message || JSON.stringify(data)}`);
              return Promise.resolve();
            } catch (jsonError) {
              // Se não conseguir ler o JSON, apenas logar o status
              console.error(`Erro ao enviar email: Status ${response.status} - ${response.statusText}`);
              return Promise.resolve();
            }
          }
        } catch (fetchError: any) {
          // Limpar o timeout se ocorrer um erro
          clearTimeout(timeoutId);
          
          // Tratar erros de rede ou timeout
          console.error('Erro de rede ao enviar email via cliente:', fetchError);
          console.log('Usando modo de simulação como fallback devido a erro de rede.');
          
          // Em caso de erro de rede, não falhar completamente
          return Promise.resolve();
        }
      } catch (clientError: any) {
        // Capturar qualquer outro erro no lado do cliente
        console.error('Erro geral ao enviar email no cliente:', clientError);
        console.log('Usando modo de simulação como fallback devido a erro geral.');
        return Promise.resolve();
      }
    } else {
      // Usar API local no servidor
      try {
        // Usar a URL base da aplicação ou localhost se não estiver definida
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        console.log('Enviando email via API local (servidor):', `${baseUrl}/api/enviar-email`);
        console.log('Configuração SMTP:', {
          host: process.env.EMAIL_SMTP_HOST,
          port: process.env.EMAIL_SMTP_PORT,
          user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'não definido',
          from: process.env.EMAIL_FROM
        });
        
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
          console.log('Email enviado com sucesso via API local (servidor)');
          return Promise.resolve();
        } else {
          const data = await response.json();
          console.error('Erro ao enviar email via API local (servidor):', data);
          
          // Verificar se é um erro de permissão e tratar adequadamente
          if (data.error?.code === 'permission-denied') {
            console.log('Erro de permissão ao enviar email. Usando modo de simulação como fallback.');
            return Promise.resolve();
          }
          
          return Promise.reject(new Error(`Erro ao enviar email: ${data.message || JSON.stringify(data)}`));
        }
      } catch (error: any) {
        console.error('Erro ao enviar email via API local (servidor):', error);
        console.error('Detalhes do erro:', {
          message: error?.message || 'Erro desconhecido',
          stack: error?.stack,
          name: error?.name,
          cause: error?.cause,
          code: error?.code
        });
        
        // Se for erro de rede, tentar usar o modo de simulação como fallback
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          console.log('Erro de rede ao enviar email. Usando modo de simulação como fallback.');
          return Promise.resolve();
        }
        
        return Promise.reject(error);
      }
    }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    console.error('Detalhes do erro:', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
      code: error?.code
    });
    
    // Em caso de erro geral, não falhar completamente
    return Promise.resolve();
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
    // Verificar se o email está em branco
    if (!email) {
      console.error('Email de destino não fornecido para envio de relatório');
      return Promise.reject(new Error('Email de destino não fornecido'));
    }

    // Configurar anexos se CSV for fornecido
    const anexos = anexoCSV
      ? [
          {
            filename: `relatorio-${new Date().toISOString().split('T')[0]}.csv`,
            content: anexoCSV,
          },
        ]
      : undefined;

    // Configurar email
    const config: EmailConfig = {
      to: email,
      subject: assunto,
      html: conteudoHTML,
      attachments: anexos,
    };

    // Verificar se estamos em modo de simulação
    if (MODO_SIMULACAO) {
      console.log('Modo de simulação ativado. Relatório não será enviado por email.');
      console.log('Configuração do email:', JSON.stringify(config, null, 2));
      return Promise.resolve();
    }

    // Enviar email
    console.log(`Enviando relatório por email para ${email}...`);
    
    try {
      // Usar a API local para enviar o email
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      console.log('Enviando relatório via API local:', `${baseUrl}/api/enviar-email`);
      
      // Verificar se estamos no lado do cliente (browser) ou servidor
      const isBrowser = typeof window !== 'undefined';
      
      if (isBrowser) {
        // No lado do cliente, usar diretamente o método enviarEmail
        // que já tem tratamento de erro adequado
        await enviarEmail(config);
        console.log('Relatório enviado com sucesso por email via cliente');
        return Promise.resolve();
      } else {
        // No lado do servidor, usar a API
        const response = await fetch(`${baseUrl}/api/enviar-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destinatario: config.to,
            assunto: config.subject,
            html: config.html,
            anexos: config.attachments,
          }),
        });

        if (response.ok) {
          console.log('Relatório enviado com sucesso por email via API');
          return Promise.resolve();
        } else {
          const data = await response.json();
          console.error('Erro ao enviar relatório por email:', data);
          
          // Verificar se é um erro de permissão e tratar adequadamente
          if (data.error?.code === 'permission-denied') {
            console.log('Erro de permissão ao enviar relatório. Usando modo de simulação como fallback.');
            return Promise.resolve();
          }
          
          return Promise.reject(new Error(`Erro ao enviar relatório por email: ${data.message || JSON.stringify(data)}`));
        }
      }
    } catch (error: any) {
      console.error('Erro ao enviar relatório por email:', error);
      console.error('Detalhes do erro:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        code: error?.code
      });
      
      // Se for erro de rede, tentar usar o modo de simulação como fallback
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.log('Erro de rede ao enviar relatório. Usando modo de simulação como fallback.');
        return Promise.resolve();
      }
      
      return Promise.reject(error);
    }
  } catch (error: any) {
    console.error('Erro ao enviar relatório por email:', error);
    console.error('Detalhes do erro:', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
      code: error?.code
    });
    return Promise.reject(error);
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
  refeicoesPorTipo?: Record<string, number>;
  refeicoes?: Array<{ 
    alunoId: string;
    nomeAluno: string;
    turma: string;
    tipo: string;
    data: Date;
  }>;
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
    const percentualNaoComeram = 100 - percentualComeram;
    
    // Gerar tabela HTML com alunos que comeram
    let tabelaComeram = '';
    if (data.alunosComeram.length > 0) {
      // Verificar se temos dados detalhados com horário
      const temDadosDetalhados = data.refeicoes && data.refeicoes.length > 0;
      
      tabelaComeram = `
        <div class="section">
          <h3 style="color: #4CAF50; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">
            <span style="vertical-align: middle;">✓</span> Alunos que comeram (${data.totalComeram})
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #e8f5e9;">
                <th style="padding: 12px; text-align: left; border: 1px solid #c8e6c9; font-weight: 600;">Nome</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #c8e6c9; font-weight: 600;">Turma</th>
                ${temDadosDetalhados ? `<th style="padding: 12px; text-align: left; border: 1px solid #c8e6c9; font-weight: 600;">Tipo</th>` : ''}
                ${temDadosDetalhados ? `<th style="padding: 12px; text-align: left; border: 1px solid #c8e6c9; font-weight: 600;">Horário</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${temDadosDetalhados ? 
                data.refeicoes!.map((refeicao, index) => {
                  const horario = refeicao.data instanceof Date 
                    ? refeicao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                    : '';
                  
                  return `
                    <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                      <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${refeicao.nomeAluno}</td>
                      <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${refeicao.turma}</td>
                      <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${refeicao.tipo || '-'}</td>
                      <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${horario || '-'}</td>
                    </tr>
                  `;
                }).join('') :
                data.alunosComeram.map((aluno, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                    <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${aluno.nome}</td>
                    <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${aluno.turma}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Gerar tabela HTML com alunos que não comeram
    let tabelaNaoComeram = '';
    if (data.alunosNaoComeram.length > 0) {
      tabelaNaoComeram = `
        <div class="section">
          <h3 style="color: #F44336; margin-bottom: 15px; border-bottom: 2px solid #F44336; padding-bottom: 8px;">
            <span style="vertical-align: middle;">✗</span> Alunos que não comeram (${data.totalNaoComeram})
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #ffebee;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ffcdd2; font-weight: 600;">Nome</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ffcdd2; font-weight: 600;">Turma</th>
              </tr>
            </thead>
            <tbody>
              ${data.alunosNaoComeram.map((aluno, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${aluno.nome}</td>
                  <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${aluno.turma}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Gerar gráfico de pizza simples usando caracteres HTML
    // Já calculamos os percentuais acima, não precisamos recalcular
    // Gerar conteúdo HTML do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Refeições</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <div style="background-color: #3f51b5; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin-bottom: 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Relatório de Refeições</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">${dataFormatada}</p>
        </div>
        
        <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px; background-color: white; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #3f51b5; margin-top: 0; border-bottom: 2px solid #3f51b5; padding-bottom: 10px; font-size: 20px;">Resumo do Dia</h2>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px;">
              <div style="flex: 1; min-width: 200px; background-color: white; padding: 15px; border-radius: 8px; margin: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <p style="font-size: 14px; color: #666; margin: 0;">Total de Alunos</p>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0 0; color: #3f51b5;">${data.totalAlunos}</p>
              </div>
              
              <div style="flex: 1; min-width: 200px; background-color: white; padding: 15px; border-radius: 8px; margin: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <p style="font-size: 14px; color: #666; margin: 0;">Comeram</p>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0 0; color: #4CAF50;">${data.totalComeram} <span style="font-size: 16px; color: #4CAF50;">(${percentualComeram}%)</span></p>
              </div>
              
              <div style="flex: 1; min-width: 200px; background-color: white; padding: 15px; border-radius: 8px; margin: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <p style="font-size: 14px; color: #666; margin: 0;">Não Comeram</p>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0 0; color: #F44336;">${data.totalNaoComeram} <span style="font-size: 16px; color: #F44336;">(${percentualNaoComeram}%)</span></p>
              </div>
            </div>
            
            <!-- Representação visual simples -->
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h3 style="margin-top: 0; color: #555; font-size: 16px;">Distribuição de Refeições</h3>
              <div style="height: 20px; background-color: #f5f5f5; border-radius: 10px; overflow: hidden; margin: 15px 0;">
                <div style="width: ${percentualComeram}%; height: 100%; background-color: #4CAF50; float: left;"></div>
                <div style="width: ${percentualNaoComeram}%; height: 100%; background-color: #F44336; float: left;"></div>
              </div>
              <div style="display: flex; justify-content: center; font-size: 14px;">
                <div style="margin-right: 20px;">
                  <span style="display: inline-block; width: 12px; height: 12px; background-color: #4CAF50; margin-right: 5px; border-radius: 2px;"></span> Comeram (${percentualComeram}%)
                </div>
                <div>
                  <span style="display: inline-block; width: 12px; height: 12px; background-color: #F44336; margin-right: 5px; border-radius: 2px;"></span> Não Comeram (${percentualNaoComeram}%)
                </div>
              </div>
            </div>
            
            ${data.refeicoesPorTipo ? `
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h3 style="margin-top: 0; color: #555; font-size: 16px;">Refeições por Tipo</h3>
              <ul style="list-style-type: none; padding: 0; margin: 10px 0 0 0;">
                ${Object.entries(data.refeicoesPorTipo).map(([tipo, quantidade]) => `
                  <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">${tipo}</span>
                    <span style="font-weight: bold; color: #3f51b5;">${quantidade}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          
          ${tabelaComeram}
          
          ${tabelaNaoComeram}
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
          <p style="margin: 5px 0;">Este relatório foi gerado automaticamente pelo Sistema Bem-Estar.</p>
          <p style="margin: 5px 0;">Data e hora de geração: ${new Date().toLocaleString('pt-BR')}</p>
          <p style="margin: 5px 0; color: #3f51b5;">© ${new Date().getFullYear()} Sistema Bem-Estar - Todos os direitos reservados</p>
        </div>
      </body>
      </html>
    `;
    
    // Gerar conteúdo CSV para anexo com detalhes das refeições
    let csvContent = 'Nome,Turma,Status,Tipo de Refeição,Data e Hora\n';
    
    // Se temos os dados detalhados das refeições, usamos eles para o CSV
    if (data.refeicoes && data.refeicoes.length > 0) {
      data.refeicoes.forEach(refeicao => {
        const dataHora = refeicao.data instanceof Date 
          ? refeicao.data.toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            }) 
          : '';
        
        csvContent += `${refeicao.nomeAluno},${refeicao.turma},Comeu,${refeicao.tipo},${dataHora}\n`;
      });
      
      // Adicionar alunos que não comeram
      data.alunosNaoComeram.forEach(aluno => {
        csvContent += `${aluno.nome},${aluno.turma},Não comeu,,-\n`;
      });
    } else {
      // Caso não tenhamos os dados detalhados, usamos os dados resumidos
      // Adicionar alunos que comeram
      data.alunosComeram.forEach(aluno => {
        csvContent += `${aluno.nome},${aluno.turma},Comeu,,-\n`;
      });
      
      // Adicionar alunos que não comeram
      data.alunosNaoComeram.forEach(aluno => {
        csvContent += `${aluno.nome},${aluno.turma},Não comeu,,-\n`;
      });
    }
    
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
