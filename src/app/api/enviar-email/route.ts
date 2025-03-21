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

// Email padrão para testes
const EMAIL_PADRAO = 'bemestar@jpiaget.com.br';

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

    // Criar conta de teste
    const testAccount = await createTestAccount();

    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    // Configurar as opções do email
    const mailOptions = {
      from: 'Sistema Bem-Estar <bemestar@jpiaget.com.br>',
      to: destinatario,
      subject: assunto,
      text: texto || '',
      html: html || '',
      attachments: anexos || []
    };

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado com sucesso:', info.messageId);
    console.log('URL de visualização:', nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    });
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { success: false, message: `Erro ao enviar email: ${error.message}` },
      { status: 500 }
    );
  }
}

// Rota para enviar email de teste
export async function GET() {
  try {
    // Criar conta de teste
    const testAccount = await createTestAccount();

    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    // Usar email padrão para testes
    const emailDestino = EMAIL_PADRAO;
    
    // Configurar as opções do email de teste
    const mailOptions = {
      from: 'Sistema Bem-Estar <bemestar@jpiaget.com.br>',
      to: emailDestino,
      subject: 'Teste de Notificação - Sistema Bem-Estar',
      html: `
        <h1>Teste de Notificação</h1>
        <p>Este é um email de teste do Sistema Bem-Estar.</p>
        <p>Se você está recebendo este email, significa que o sistema de notificações está funcionando corretamente.</p>
        <p>Data e hora do envio: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Este email foi enviado automaticamente, por favor não responda.</p>
      `
    };

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email de teste enviado com sucesso:', info.messageId);
    console.log('URL de visualização:', nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ 
      success: true, 
      message: 'Email de teste enviado com sucesso (modo de teste)',
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    });
  } catch (error: any) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json(
      { success: false, message: `Erro ao enviar email de teste: ${error.message}` },
      { status: 500 }
    );
  }
}
