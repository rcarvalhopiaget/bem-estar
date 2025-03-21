import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');

  if (tipo === 'teste') {
    const dataHora = new Date().toLocaleString('pt-BR');
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visualização do Email de Teste</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
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
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  return NextResponse.json({ error: 'Tipo de email não suportado' }, { status: 400 });
}
