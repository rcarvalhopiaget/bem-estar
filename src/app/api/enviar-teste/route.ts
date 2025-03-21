import { NextResponse } from 'next/server';
import { obterConfiguracaoEnvioRelatorio } from '@/services/emailService';
import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/email.config';

export async function GET(request: Request) {
  try {
    console.log('Iniciando envio de email de teste...');
    
    // Obter o email do parâmetro de consulta, se fornecido
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    
    // Obter configuração de envio
    const config = await obterConfiguracaoEnvioRelatorio();
    console.log('Configuração obtida:', config);
    
    // Usar o email do parâmetro de consulta, se fornecido, ou o email da configuração
    const destinatario = emailParam || config.email;
    
    // Verificar se há um email configurado
    if (!destinatario) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum email configurado para envio de relatórios'
      }, { status: 400 });
    }
    
    console.log('Enviando email para', destinatario, '...');
    
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
            </p>
          </div>
        `;
    
    let transporter;
    let previewUrl = null;
    
    // Verificar se estamos em modo de teste
    if (emailConfig.testMode) {
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
    } else {
      // Usar configuração SMTP real
      transporter = nodemailer.createTransport(emailConfig.smtp);
    }
    
    // Enviar email
    const info = await transporter.sendMail({
      from: emailConfig.defaultFrom,
      to: destinatario,
      subject: 'Teste de Envio Automático - Sistema Bem-Estar',
      html: html,
    });
    
    console.log('Email de teste enviado com sucesso para', destinatario);
    
    // Obter URL de visualização se estiver em modo de teste
    if (emailConfig.testMode) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);
    }
    
    return NextResponse.json({
      success: true,
      message: `Email de teste enviado para ${destinatario}`,
      previewUrl: previewUrl || `/api/preview-email?tipo=teste`,
      testMode: emailConfig.testMode
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
