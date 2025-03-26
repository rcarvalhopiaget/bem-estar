import { NextResponse } from 'next/server';
import { obterConfiguracaoEnvioRelatorio } from '@/services/emailService';
import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/email.config';

// Modo de simulação baseado apenas na configuração
const MODO_SIMULACAO = emailConfig.testMode;
// Parâmetro de URL para forçar simulação
const forcarSimulacao = (request: Request) => {
  const { searchParams } = new URL(request.url);
  return searchParams.get('simulacao') === 'true';
};

export async function GET(request: Request) {
  try {
    console.log('Iniciando envio de email de teste...');
    
    // Obter o email do parâmetro de consulta, se fornecido
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    
    // Verificar se devemos forçar o modo de simulação
    const modoSimulacao = MODO_SIMULACAO || forcarSimulacao(request);
    
    // Obter configuração de envio com tratamento de erro
    let config;
    try {
      config = await obterConfiguracaoEnvioRelatorio();
      console.log('Configuração obtida:', config);
    } catch (configError: any) {
      // Se houver erro de permissão, usar valores padrão
      if (configError?.code === 'permission-denied') {
        console.log('Aviso: Usando configurações padrão devido a restrições de permissão');
        config = emailConfig.defaultConfig;
      } else {
        console.error('Erro ao obter configurações:', configError);
        config = emailConfig.defaultConfig;
      }
    }
    
    // Usar o email do parâmetro de consulta, se fornecido, ou o email da configuração
    const destinatario = emailParam || config.email;
    
    // Verificar se há um email configurado
    if (!destinatario && !modoSimulacao) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum email configurado para envio de relatórios'
      }, { status: 400 });
    }
    
    console.log('Enviando email para', destinatario || 'test@example.com', '...');
    
    // Preparar o conteúdo do email
    const dataHora = new Date().toLocaleString('pt-BR');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste de Email - Sistema Bem-Estar</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
          <!-- Cabeçalho -->
          <div style="background-color: #3f51b5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Sistema Bem-Estar</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Teste de Configuração de Email</p>
          </div>
          
          <!-- Conteúdo -->
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Olá,</p>
            
            <p style="font-size: 16px; line-height: 1.5;">Este é um email de teste do <strong>Sistema Bem-Estar</strong>.</p>
            
            <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #2e7d32;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: #4CAF50; border-radius: 50%; color: white; text-align: center; line-height: 20px; margin-right: 8px;">✓</span>
                Seu sistema de envio de emails está funcionando corretamente!
              </p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #555; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Detalhes do Teste</h3>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Data e hora:</span>
                <span style="font-weight: 600;">${dataHora}</span>
              </p>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Modo:</span>
                <span style="font-weight: 600; color: ${modoSimulacao ? '#ff9800' : '#4CAF50'};">
                  ${modoSimulacao ? 'Simulação' : 'Produção'}
                </span>
              </p>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Servidor SMTP:</span>
                <span style="font-weight: 600;">${process.env.EMAIL_SMTP_HOST || 'Não configurado'}</span>
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5;">
              Este email confirma que suas configurações SMTP estão corretas e o sistema está pronto para enviar relatórios.
            </p>
            
            ${modoSimulacao ? `
            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #e65100;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: #ff9800; border-radius: 50%; color: white; text-align: center; line-height: 20px; margin-right: 8px;">!</span>
                <strong>Aviso:</strong> Este é um email de simulação para fins de teste.
              </p>
            </div>
            ` : ''}
          </div>
          
          <!-- Rodapé -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Este email foi enviado automaticamente pelo Sistema Bem-Estar, por favor não responda.
            </p>
            <p style="color: #3f51b5; font-size: 14px; margin: 10px 0 0 0;">
              ${new Date().getFullYear()} Sistema Bem-Estar - Todos os direitos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    let transporter;
    let previewUrl = null;
    let simulado = false;
    
    try {
      // Verificar se estamos em modo de teste
      if (modoSimulacao) {
        // Criar um transportador de teste
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        simulado = true;
      } else {
        // Usar configuração SMTP real
        transporter = nodemailer.createTransport(emailConfig.smtp);
      }
      
      // Enviar email
      const info = await transporter.sendMail({
        from: emailConfig.defaultFrom,
        to: simulado ? 'test@example.com' : destinatario,
        subject: `${simulado ? '[SIMULAÇÃO] ' : ''}Teste de Envio Automático - Sistema Bem-Estar`,
        html: html,
      });
      
      console.log(`Email de teste ${simulado ? 'simulado ' : ''}enviado com sucesso para ${simulado ? 'test@example.com' : destinatario}`);
      
      // Obter URL de visualização se estiver em modo de teste
      if (simulado) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL:', previewUrl);
      }
      
      return NextResponse.json({
        success: true,
        message: `Email de teste ${simulado ? 'simulado ' : ''}enviado para ${simulado ? 'test@example.com' : destinatario}`,
        previewUrl: previewUrl || `/api/preview-email?tipo=teste`,
        testMode: simulado
      });
    } catch (smtpError: any) {
      // Se for erro de autenticação, tentar em modo de simulação
      if ((smtpError?.code === 'EAUTH' || smtpError?.responseCode === 535) && !simulado) {
        console.log('Erro de autenticação SMTP. Tentando enviar em modo de simulação...');
        
        try {
          // Criar conta de teste
          const testAccount = await nodemailer.createTestAccount();
          
          // Criar transportador de teste
          const fallbackTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          
          // Adicionar aviso no email
          const fallbackHtml = `
            <div style="background-color: #ffeeee; padding: 10px; margin-bottom: 20px; border-left: 4px solid #ff6666; border-radius: 4px;">
              <p><strong>AVISO:</strong> Este é um email de simulação devido a problemas com a configuração SMTP.</p>
              <p>O sistema tentou enviar um email real, mas encontrou um erro de autenticação.</p>
              <p>Erro: ${smtpError.message}</p>
            </div>
            ${html}
          `;
          
          // Enviar email simulado
          const fallbackInfo = await fallbackTransporter.sendMail({
            from: emailConfig.defaultFrom,
            to: 'test@example.com',
            subject: `[SIMULAÇÃO - FALLBACK] Teste de Envio Automático - Sistema Bem-Estar`,
            html: fallbackHtml,
          });
          
          // Obter URL de visualização
          const fallbackPreviewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
          console.log('Email enviado em modo de simulação (fallback). Preview URL:', fallbackPreviewUrl);
          
          return NextResponse.json({
            success: true,
            message: 'Email de teste enviado em modo de simulação (fallback) devido a erro de autenticação',
            previewUrl: fallbackPreviewUrl,
            testMode: true,
            fallback: true,
            originalError: smtpError.message
          });
        } catch (fallbackError) {
          console.error('Erro ao enviar email em modo de simulação (fallback):', fallbackError);
          throw smtpError; // Lançar o erro original
        }
      }
      
      // Repassar o erro original
      throw smtpError;
    }
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('Iniciando envio de email de teste via POST...');
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { destinatario, assunto, conteudo } = body;
    
    // Verificar se o destinatário foi fornecido
    if (!destinatario) {
      return NextResponse.json({
        success: false,
        message: 'Destinatário é obrigatório'
      }, { status: 400 });
    }
    
    console.log('Enviando email para', destinatario, '...');
    
    // Verificar se devemos forçar o modo de simulação
    const modoSimulacao = MODO_SIMULACAO || forcarSimulacao(request);
    
    // Preparar o conteúdo do email
    const dataHora = new Date().toLocaleString('pt-BR');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste de Email - Sistema Bem-Estar</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
          <!-- Cabeçalho -->
          <div style="background-color: #3f51b5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Sistema Bem-Estar</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Teste de Configuração de Email</p>
          </div>
          
          <!-- Conteúdo -->
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Olá,</p>
            
            <p style="font-size: 16px; line-height: 1.5;">Este é um email de teste do <strong>Sistema Bem-Estar</strong>.</p>
            
            <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #2e7d32;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: #4CAF50; border-radius: 50%; color: white; text-align: center; line-height: 20px; margin-right: 8px;">✓</span>
                Seu sistema de envio de emails está funcionando corretamente!
              </p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #555; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Detalhes do Teste</h3>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Data e hora:</span>
                <span style="font-weight: 600;">${dataHora}</span>
              </p>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Modo:</span>
                <span style="font-weight: 600; color: ${modoSimulacao ? '#ff9800' : '#4CAF50'};">
                  ${modoSimulacao ? 'Simulação' : 'Produção'}
                </span>
              </p>
              <p style="margin: 10px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 500; color: #666;">Servidor SMTP:</span>
                <span style="font-weight: 600;">${process.env.EMAIL_SMTP_HOST || 'Não configurado'}</span>
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5;">
              Este email confirma que suas configurações SMTP estão corretas e o sistema está pronto para enviar relatórios.
            </p>
            
            ${modoSimulacao ? `
            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #e65100;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: #ff9800; border-radius: 50%; color: white; text-align: center; line-height: 20px; margin-right: 8px;">!</span>
                <strong>Aviso:</strong> Este é um email de simulação para fins de teste.
              </p>
            </div>
            ` : ''}
          </div>
          
          <!-- Rodapé -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Este email foi enviado automaticamente pelo Sistema Bem-Estar, por favor não responda.
            </p>
            <p style="color: #3f51b5; font-size: 14px; margin: 10px 0 0 0;">
              ${new Date().getFullYear()} Sistema Bem-Estar - Todos os direitos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    let transporter;
    let previewUrl = null;
    let simulado = false;
    
    try {
      // Verificar se estamos em modo de teste
      if (modoSimulacao) {
        // Criar um transportador de teste
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        simulado = true;
      } else {
        // Usar configuração SMTP real
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SMTP_HOST,
          port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }
      
      // Verificar conexão com o servidor SMTP
      await transporter.verify();
      console.log('Conexão com servidor SMTP verificada com sucesso');
      
      // Enviar email
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || emailConfig.defaultFrom,
        to: destinatario,
        subject: `${simulado ? '[SIMULAÇÃO] ' : ''}${assunto || 'Teste de Envio de Email - Sistema Bem-Estar'}`,
        html: html,
      });
      
      console.log(`Email de teste ${simulado ? 'simulado ' : ''}enviado com sucesso para ${destinatario}`);
      console.log('ID da mensagem:', info.messageId);
      
      // Obter URL de visualização se estiver em modo de teste
      if (simulado) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL:', previewUrl);
      }
      
      return NextResponse.json({
        success: true,
        message: `Email de teste ${simulado ? 'simulado ' : ''}enviado para ${destinatario}`,
        previewUrl: previewUrl,
        testMode: simulado,
        details: {
          messageId: info.messageId,
          response: info.response
        }
      });
    } catch (smtpError: any) {
      console.error('Erro SMTP:', smtpError);
      
      // Se for erro de autenticação, tentar em modo de simulação
      if ((smtpError?.code === 'EAUTH' || smtpError?.responseCode === 535) && !simulado) {
        console.log('Erro de autenticação SMTP. Tentando enviar em modo de simulação...');
        
        try {
          // Criar conta de teste
          const testAccount = await nodemailer.createTestAccount();
          
          // Criar transportador de teste
          const fallbackTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          
          // Adicionar aviso no email
          const fallbackHtml = `
            <div style="background-color: #ffeeee; padding: 10px; margin-bottom: 20px; border-left: 4px solid #ff6666; border-radius: 4px;">
              <p><strong>AVISO:</strong> Este é um email de simulação devido a problemas com a configuração SMTP.</p>
              <p>O sistema tentou enviar um email real, mas encontrou um erro de autenticação.</p>
              <p>Erro: ${smtpError.message}</p>
            </div>
            ${html}
          `;
          
          // Enviar email simulado
          const fallbackInfo = await fallbackTransporter.sendMail({
            from: emailConfig.defaultFrom,
            to: destinatario,
            subject: `[SIMULAÇÃO - FALLBACK] ${assunto || 'Teste de Envio de Email - Sistema Bem-Estar'}`,
            html: fallbackHtml,
          });
          
          // Obter URL de visualização
          const fallbackPreviewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
          console.log('Email enviado em modo de simulação (fallback). Preview URL:', fallbackPreviewUrl);
          
          return NextResponse.json({
            success: true,
            message: 'Email de teste enviado em modo de simulação (fallback) devido a erro de autenticação',
            previewUrl: fallbackPreviewUrl,
            testMode: true,
            fallback: true,
            originalError: smtpError.message
          });
        } catch (fallbackError) {
          console.error('Erro ao enviar email em modo de simulação (fallback):', fallbackError);
          throw smtpError; // Lançar o erro original
        }
      }
      
      // Repassar o erro original
      throw smtpError;
    }
  } catch (error: any) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error instanceof Error ? error.message : String(error),
      details: error
    }, { status: 500 });
  }
}
