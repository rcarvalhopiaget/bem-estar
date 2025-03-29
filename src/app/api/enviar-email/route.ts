import { NextResponse } from 'next/server';
import { z } from 'zod';
import { _enviarEmailServidor } from '@/services/emailService.server'; // Importar a função do servidor
import { emailConfig } from '@/config/email.config';

// Schema para validar o corpo da requisição
const EnviarEmailSchema = z.object({
  destinatario: z.string().email(),
  assunto: z.string().min(1),
  texto: z.string().optional(),
  html: z.string().optional(),
  // Anexos não estão sendo tratados nesta versão simples
});

/**
 * API Route para enviar emails genéricos.
 * Usada pela função `enviarEmail` do cliente.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar o corpo da requisição
    const validationResult = EnviarEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { destinatario, assunto, texto, html } = validationResult.data;

    // Chamar a função de envio do servidor
    const resultadoEnvio = await _enviarEmailServidor({
      to: destinatario,
      subject: assunto,
      text: texto,
      html: html,
      // Anexos não implementados aqui
    });

    if (resultadoEnvio.success) {
      return NextResponse.json(
        { success: true, message: resultadoEnvio.message, previewUrl: resultadoEnvio.previewUrl },
        { status: 200 }
      );
    } else {
      // Log do erro já acontece em _enviarEmailServidor
      return NextResponse.json(
        { success: false, message: resultadoEnvio.message },
        { status: 500 } // Ou outro status apropriado dependendo do erro
      );
    }

  } catch (error: any) {
    console.error('[API /api/enviar-email] Erro inesperado:', error);
    // Evitar vazar detalhes do erro
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao processar o envio de email.' },
      { status: 500 }
    );
  }
}

// Opcional: Adicionar um GET handler para health check ou informações
export async function GET() {
  return NextResponse.json({ message: 'API de envio de email operacional.', testMode: emailConfig.testMode });
}
