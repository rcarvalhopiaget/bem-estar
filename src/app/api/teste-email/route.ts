import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // Obter as configurações diretamente das variáveis de ambiente
    const emailConfig = {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
      testMode: process.env.EMAIL_TEST_MODE
    };

    // Exibir as configurações (sem a senha completa por segurança)
    const configDisplay = {
      ...emailConfig,
      pass: emailConfig.pass ? `${emailConfig.pass.substring(0, 3)}...${emailConfig.pass.substring(emailConfig.pass.length - 3)}` : 'Não configurado'
    };

    // Verificar se as configurações estão presentes
    const configOk = 
      !!emailConfig.host && 
      !!emailConfig.port && 
      !!emailConfig.user && 
      !!emailConfig.pass;

    // Criar transportador para teste
    let transporterInfo = "Não testado";
    
    if (configOk) {
      try {
        const transporter = nodemailer.createTransport({
          host: emailConfig.host,
          port: parseInt(emailConfig.port || '587'),
          secure: false,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        // Verificar conexão
        await transporter.verify();
        transporterInfo = "Conexão com servidor SMTP bem-sucedida";
      } catch (error: any) {
        transporterInfo = `Erro na conexão SMTP: ${error.message || 'Erro desconhecido'}`;
      }
    }

    return NextResponse.json({
      success: true,
      config: configDisplay,
      configOk,
      transporterInfo,
      message: "Verificação de configuração de email concluída"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Erro ao verificar configuração de email",
      error: error.message || "Erro desconhecido"
    }, { status: 500 });
  }
}
