import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Criação de uma conta de teste do Ethereal Email
async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return testAccount;
  } catch (error) {
    console.error('Erro ao criar conta de teste:', error);
    // Fallback para conta fixa caso falhe
    return {
      user: 'ethereal.user@ethereal.email',
      pass: 'verysecret',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false }
    };
  }
}

// Modo de simulação baseado apenas na configuração
const MODO_SIMULACAO = process.env.EMAIL_TEST_MODE === 'true';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatario, assunto, html, texto, anexos } = body;

    // Verificar se os campos obrigatórios foram fornecidos
    if (!destinatario || !assunto || (!html && !texto)) {
      return NextResponse.json(
        { success: false, message: 'Destinatário, assunto e conteúdo (HTML ou texto) são obrigatórios' },
        { status: 400 }
      );
    }

    let transporter;
    let previewUrl = null;
    let simulado = false;

    // Log das configurações SMTP para debug
    console.log('Configurações SMTP diretas do .env:', {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      user: process.env.EMAIL_USER ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      pass: process.env.EMAIL_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      from: process.env.EMAIL_FROM,
      testMode: process.env.EMAIL_TEST_MODE
    });

    // Verificar se estamos em modo de teste
    if (MODO_SIMULACAO) {
      // Criar um transportador de teste
      const testAccount = await createTestAccount();
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
      console.log('Usando modo de simulação para envio de email');
    } else {
      // Usar configuração SMTP diretamente das variáveis de ambiente
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
        secure: false, // Forçar conexão não segura
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          // Não verificar certificado
          rejectUnauthorized: false
        }
      });
      console.log('Usando configuração SMTP real para envio de email');
    }

    // Verificar se o transportador está funcionando
    try {
      await transporter.verify();
      console.log('Servidor SMTP está pronto para enviar mensagens');
    } catch (verifyError: any) {
      console.error('Erro na verificação do servidor SMTP:', verifyError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro na conexão com o servidor SMTP', 
          error: verifyError instanceof Error ? verifyError.message : String(verifyError),
          details: verifyError !== null && typeof verifyError === 'object' ? {
            name: verifyError.name,
            code: verifyError.code,
            command: verifyError.command
          } : {}
        },
        { status: 500 }
      );
    }

    // Configurar as opções do email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Sistema Bem-Estar <bemestar@jpiaget.com.br>',
      to: simulado ? 'test@example.com' : destinatario,
      subject: `${simulado ? '[SIMULAÇÃO] ' : ''}${assunto}`,
      text: texto || 'Este email contém conteúdo HTML. Por favor, use um cliente de email que suporte HTML.',
      html: html,
      attachments: anexos,
      // Garantir que o HTML seja priorizado e exibido corretamente
      alternatives: html ? [
        {
          contentType: 'text/html; charset=utf-8',
          content: html
        }
      ] : undefined
    };

    console.log('Enviando email com as seguintes opções:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text,
      attachmentsCount: mailOptions.attachments?.length || 0,
      htmlLength: mailOptions.html?.length || 0
    });

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);

    // Obter URL de visualização se estiver em modo de teste
    if (simulado) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);
    }

    return NextResponse.json({
      success: true,
      message: `Email ${simulado ? 'simulado ' : ''}enviado com sucesso para ${simulado ? 'test@example.com' : destinatario}`,
      previewUrl,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    
    // Capturar detalhes específicos do erro de nodemailer
    const errorDetails = error !== null && typeof error === 'object' ? {
      message: error.message || 'Erro desconhecido',
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      stack: error.stack,
      name: error.name
    } : {};
    
    console.error('Detalhes do erro:', errorDetails);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao enviar email', 
        error: error instanceof Error ? error.message : String(error),
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Obter o email do parâmetro de consulta, se fornecido
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const assuntoParam = searchParams.get('assunto') || 'Teste de Email do Sistema Bem-Estar';
    
    // Verificar se deve forçar o modo de simulação
    const forcarSimulacao = searchParams.get('simulacao') === 'true';
    const modoSimulacao = MODO_SIMULACAO || forcarSimulacao;
    
    // Verificar se há um email configurado
    if (!emailParam && !modoSimulacao) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum email fornecido para o teste'
      }, { status: 400 });
    }
    
    // Preparar o conteúdo do email
    const dataHora = new Date().toLocaleString('pt-BR');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h1 style="color: #4a6da7; border-bottom: 1px solid #eee; padding-bottom: 10px;">Teste de Envio Automático</h1>
        
        <p>Olá,</p>
        
        <p>Este é um email de teste do <strong>Sistema Bem-Estar</strong>.</p>
        
        <p>Se você está recebendo este email, significa que o sistema de envio automático está funcionando corretamente.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Data e hora do envio:</strong> ${dataHora}</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
          Este email foi enviado automaticamente pelo Sistema Bem-Estar, por favor não responda.
          ${modoSimulacao ? '<br><strong>AVISO: Este é um email de simulação para fins de teste.</strong>' : ''}
        </p>
      </div>
    `;
    
    let transporter;
    let previewUrl = null;
    let simulado = false;
    
    try {
      // Verificar se estamos em modo de teste
      if (modoSimulacao) {
        // Criar um transportador de teste
        const testAccount = await createTestAccount();
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
          secure: false, // Forçar conexão não segura
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            // Não verificar certificado
            rejectUnauthorized: false
          }
        });
      }
      
      // Verificar se o transportador está funcionando
      try {
        await transporter.verify();
        console.log('Servidor SMTP está pronto para enviar mensagens');
      } catch (verifyError: any) {
        console.error('Erro na verificação do servidor SMTP:', verifyError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Erro na conexão com o servidor SMTP', 
            error: verifyError instanceof Error ? verifyError.message : String(verifyError),
            details: verifyError !== null && typeof verifyError === 'object' ? {
              name: verifyError.name,
              code: verifyError.code,
              command: verifyError.command
            } : {}
          },
          { status: 500 }
        );
      }
      
      // Enviar email
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Sistema Bem-Estar <bemestar@jpiaget.com.br>',
        to: simulado ? 'test@example.com' : (emailParam || 'test@example.com'),
        subject: `${simulado ? '[SIMULAÇÃO] ' : ''}${assuntoParam}`,
        html: html,
        alternatives: html ? [
          {
            contentType: 'text/html; charset=utf-8',
            content: html
          }
        ] : undefined
      });
      
      console.log(`Email de teste ${simulado ? 'simulado ' : ''}enviado com sucesso para ${simulado ? 'test@example.com' : emailParam}`);
      
      // Obter URL de visualização se estiver em modo de teste
      if (simulado && 'messageId' in info) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL:', previewUrl);
      }
      
      return NextResponse.json({
        success: true,
        message: `Email de teste ${simulado ? 'simulado ' : ''}enviado para ${simulado ? 'test@example.com' : emailParam}`,
        previewUrl: previewUrl || `/api/preview-email?tipo=teste`,
        testMode: simulado
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de teste:', error);
      
      // Capturar detalhes específicos do erro de nodemailer
      const errorDetails = error !== null && typeof error === 'object' ? {
        message: error.message || 'Erro desconhecido',
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response,
        stack: error.stack,
        name: error.name
      } : {};
      
      console.error('Detalhes do erro:', errorDetails);
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao enviar email de teste',
        error: error instanceof Error ? error.message : String(error),
        details: errorDetails
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao processar requisição de teste de email:', error);
    
    // Capturar detalhes específicos do erro
    const errorDetails = error !== null && typeof error === 'object' ? {
      message: error.message || 'Erro desconhecido',
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      stack: error.stack,
      name: error.name
    } : {};
    
    console.error('Detalhes do erro:', errorDetails);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao processar requisição',
      error: error instanceof Error ? error.message : String(error),
      details: errorDetails
    }, { status: 500 });
  }
}
