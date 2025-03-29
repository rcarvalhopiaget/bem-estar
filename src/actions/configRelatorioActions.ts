'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { _enviarEmailServidor } from '@/services/emailService.server';
import { emailConfig } from '@/config/email.config';
import { getUserServer } from '@/lib/auth/getUserServer';
import { getPermissions } from '@/lib/auth/getPermissions';

// --- Tipos e Schemas ---

export interface ConfiguracaoRelatorio {
  emails: string[];
  horario: string; // Formato HH:MM
  ativo: boolean;
}

const EmailSchema = z.string().email({ message: "Email inválido." });

const SalvarConfigSchema = z.object({
  emails: z.array(EmailSchema).min(1, "Pelo menos um email é obrigatório."),
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de horário inválido (HH:MM)."),
  ativo: z.boolean(),
});

// --- Server Actions ---

/**
 * [Server Action] Obtém a configuração de envio de relatórios do Firestore.
 * Requer permissão para gerenciar configurações.
 */
export async function getConfiguracaoRelatorio(): Promise<{
  success: boolean;
  data?: ConfiguracaoRelatorio;
  error?: string;
}> {
  try {
    const user = await getUserServer();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    const permissions = await getPermissions(user.id);
    if (!permissions.podeGerenciarConfiguracoes) {
      return { success: false, error: 'Permissão negada.' };
    }

    const adminApp = initializeFirebaseAdmin();
    const adminDb = admin.firestore(adminApp);
    const configDocRef = adminDb.collection('configuracoes').doc('envioRelatorio');
    const configDoc = await configDocRef.get();

    if (configDoc.exists) {
      const data = configDoc.data() as ConfiguracaoRelatorio;
      // Validar e fornecer valores padrão se necessário
      const config: ConfiguracaoRelatorio = {
        emails: Array.isArray(data?.emails) ? data.emails.filter(e => typeof e === 'string') : [],
        horario: data?.horario && typeof data.horario === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.horario) ? data.horario : '18:00',
        ativo: typeof data?.ativo === 'boolean' ? data.ativo : true,
      };
      return { success: true, data: config };
    } else {
      // Retorna configuração padrão se não existir
      return { success: true, data: { emails: [], horario: '18:00', ativo: true } };
    }
  } catch (error: any) {
    console.error('[Action getConfiguracaoRelatorio] Erro:', error);
    return { success: false, error: `Erro ao buscar configuração: ${error.message}` };
  }
}

/**
 * [Server Action] Salva a configuração de envio de relatórios no Firestore.
 * Requer permissão para gerenciar configurações.
 * @param data Dados da configuração a salvar.
 */
export async function salvarConfiguracaoRelatorio(data: ConfiguracaoRelatorio): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}> {
  try {
    const user = await getUserServer();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    const permissions = await getPermissions(user.id);
    if (!permissions.podeGerenciarConfiguracoes) {
      return { success: false, error: 'Permissão negada.' };
    }

    // Validação com Zod
    const validationResult = SalvarConfigSchema.safeParse(data);
    if (!validationResult.success) {
      console.warn('[Action salvarConfiguracaoRelatorio] Erro de validação:', validationResult.error.flatten().fieldErrors);
      return {
        success: false,
        error: 'Dados inválidos.',
        fieldErrors: validationResult.error.flatten().fieldErrors,
      };
    }

    const adminApp = initializeFirebaseAdmin();
    const adminDb = admin.firestore(adminApp);
    const configDocRef = adminDb.collection('configuracoes').doc('envioRelatorio');

    await configDocRef.set(validationResult.data, { merge: true }); // Usa merge para não sobrescrever outros campos

    console.log('[Action salvarConfiguracaoRelatorio] Configuração salva com sucesso:', validationResult.data);

    // Revalidar a página de configurações para refletir a mudança
    revalidatePath('/configuracoes/relatorios');

    return { success: true };
  } catch (error: any) {
    console.error('[Action salvarConfiguracaoRelatorio] Erro:', error);
    return { success: false, error: `Erro ao salvar configuração: ${error.message}` };
  }
}

/**
 * [Server Action] Envia um email de teste usando as configurações do servidor.
 * Requer permissão para gerenciar configurações.
 * @param emailDestino O email para o qual enviar o teste (opcional, usa config se não fornecido)
 */
export async function enviarEmailTesteAction(emailDestino?: string): Promise<{
  success: boolean;
  message: string;
  previewUrl?: string | false;
}> {
  try {
    const user = await getUserServer();
    if (!user) return { success: false, message: 'Usuário não autenticado.' };

    const permissions = await getPermissions(user.id);
    if (!permissions.podeGerenciarConfiguracoes) {
      return { success: false, message: 'Permissão negada.' };
    }

    // Determina o destinatário: usa o fornecido ou o padrão de teste
    const destinatario = emailDestino || emailConfig.testRecipient || 'test@example.com';
    const assunto = 'Email de Teste - Sistema Bem-Estar';
    const corpoHtml = `
      <h1>Email de Teste</h1>
      <p>Este é um email de teste enviado a partir das configurações do sistema Bem-Estar.</p>
      <p>Horário do envio: ${new Date().toLocaleString('pt-BR')}</p>
      ${emailConfig.testMode ? '<p style="color: orange;"><b>Modo de simulação (Ethereal) está ATIVO.</b></p>' : '<p style="color: green;"><b>Modo de envio real está ATIVO.</b></p>'}
    `;

    console.log(`[Action enviarEmailTesteAction] Tentando enviar email de teste para: ${destinatario}`);

    // Chama a função de envio do servidor
    const resultadoEnvio = await _enviarEmailServidor({
      to: destinatario,
      subject: assunto,
      html: corpoHtml,
    });

    if (resultadoEnvio.success) {
      console.log('[Action enviarEmailTesteAction] Email de teste enviado com sucesso.', { previewUrl: resultadoEnvio.previewUrl });
    } else {
      console.error('[Action enviarEmailTesteAction] Falha ao enviar email de teste:', resultadoEnvio.message);
    }

    // Retorna o resultado completo da função de envio
    return resultadoEnvio;

  } catch (error: any) {
    console.error('[Action enviarEmailTesteAction] Erro inesperado:', error);
    return {
      success: false,
      message: `Erro inesperado ao enviar email de teste: ${error.message}`,
    };
  }
} 