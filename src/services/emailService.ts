// REMOVIDO: import nodemailer from 'nodemailer';
// REMOVIDO: importações do Firebase client SDK
// REMOVIDO: import { emailConfig } from '@/config/email.config';

// REMOVIDO: Constante MODO_SIMULACAO

// Interface de configuração para a função cliente
// (Pode ser simplificada ou mantida dependendo do uso)
interface EmailConfigCliente {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string; // No cliente, geralmente enviaremos como string (base64 talvez?)
    contentType?: string;
  }>;
}

// REMOVIDO: Funções internas do servidor (_createTestAccount, _enviarEmailServidor)
// REMOVIDO: Interfaces RelatorioData, etc.
// REMOVIDO: Funções gerarConteudoHTML, gerarConteudoCSV
// REMOVIDO: Função enviarRelatorioEmail (será feita via Server Action ou API)
// REMOVIDO: Função obterConfiguracaoEnvioRelatorio (será feita via Server Action)
// REMOVIDO: Função salvarConfiguracaoEnvioRelatorio (será feita via Server Action)
// REMOVIDO: Função enviarRelatorioDiario (movida para emailService.server.ts)
// REMOVIDO: Função enviarEmailTeste (será feita via Server Action)


/**
 * [CLIENTE] Envia um email genérico chamando a API Route /api/enviar-email.
 * Esta função é segura para ser usada em componentes 'use client'.
 * @param config Configuração do email
 * @returns Promise que resolve após a tentativa de envio.
 */
export const enviarEmail = async (config: EmailConfigCliente): Promise<void> => {
  // Garante que só executa no browser
  if (typeof window === 'undefined') {
    console.warn('A função `enviarEmail` do cliente foi chamada no servidor. Use a API route ou Server Actions diretamente.');
    // Poderia lançar um erro ou apenas retornar para evitar comportamento inesperado
    return Promise.resolve();
  }

  try {
    const baseUrl = window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/enviar-email`;
    console.log('[CLIENTE] Enviando email via API:', apiUrl);

    // Timeout para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Mapeia os campos da config para o corpo esperado pela API
          destinatario: config.to,
          assunto: config.subject,
          texto: config.text,
          html: config.html,
          // Nota: Anexos podem precisar de tratamento especial (ex: Base64)
          // A API /api/enviar-email precisa ser capaz de lidar com isso.
          // Por simplicidade, omitindo anexos aqui, a API precisa ser ajustada se necessário.
          // anexos: config.attachments 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json(); // Tenta ler a resposta JSON
        console.log('[CLIENTE] Email enviado com sucesso via API:', data);
        // Opcional: Mostrar toast de sucesso
      } else {
        // Tenta ler o corpo do erro
        let errorData = { message: `Status ${response.status} - ${response.statusText}` };
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Ignora se não for JSON
        }
        console.error('[CLIENTE] Erro ao enviar email via API:', errorData);
        // Opcional: Mostrar toast de erro
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[CLIENTE] Erro ao enviar email: Timeout da requisição para API.');
      } else {
        console.error('[CLIENTE] Erro de rede ou fetch ao enviar email via API:', fetchError);
      }
      // Opcional: Mostrar toast de erro de rede
    }
  } catch (clientError: any) {
    console.error('[CLIENTE] Erro inesperado na função enviarEmail:', clientError);
    // Opcional: Mostrar toast de erro genérico
  }
  // A função do cliente geralmente não deve lançar erros que travem a UI.
  // Resolve a promise para indicar que a operação (tentativa) terminou.
  return Promise.resolve();
};
