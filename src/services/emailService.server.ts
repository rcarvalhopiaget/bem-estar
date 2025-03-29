import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/email.config';

// Constantes de configuração
const MODO_SIMULACAO = process.env.EMAIL_TEST_MODE === 'true' || emailConfig.testMode;

// Interface para Configuração de Email (usada internamente)
interface EmailConfigServer {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Interface para os dados do relatório (usada internamente)
interface RelatorioData {
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
}

// --- Funções INTERNAS do Servidor ---

async function _createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return testAccount;
  } catch (error) {
    console.error('Erro ao criar conta de teste Ethereal:', error);
    // Retorna credenciais padrão se a criação falhar
    return {
      user: 'ethereal.user@example.com', // Use um domínio de exemplo mais genérico
      pass: 'verysecretpassword',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false }
    };
  }
}

/**
 * [INTERNO] Envia um email usando Nodemailer diretamente do servidor.
 * Não deve ser exportado diretamente para o cliente.
 * @param config Configuração do email
 * @returns Objeto com resultado do envio
 */
export async function _enviarEmailServidor(config: EmailConfigServer): Promise<{ success: boolean; message: string; previewUrl?: string | false; messageId?: string }> {
  let transporter;
  let previewUrl: string | false | undefined = undefined;
  let simulado = MODO_SIMULACAO;

  try {
    // Log seguro das configurações (sem senha)
    console.log('(Servidor) Tentando envio com Config SMTP:', {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      userConfigurado: !!process.env.EMAIL_USER,
      passConfigurado: !!process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
      testModeEnv: process.env.EMAIL_TEST_MODE,
      testModeConfig: emailConfig.testMode,
      usandoSimulacao: simulado
    });

    if (simulado) {
      const testAccount = await _createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('(Servidor) Usando transporte de simulação Ethereal.');
    } else {
      // Validação rigorosa das credenciais
      if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_SMTP_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM) {
        console.error('(Servidor) ERRO FATAL: Credenciais SMTP incompletas ou não configuradas nas variáveis de ambiente.');
        throw new Error('Credenciais SMTP do servidor não configuradas corretamente.');
      }
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
        secure: process.env.EMAIL_SMTP_SECURE === 'true', // Verifica se a string é 'true'
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          // Permite desabilitar a rejeição de certificados não autorizados (use com cautela)
          rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
      console.log('(Servidor) Usando transporte SMTP real.');
    }

    // Verifica a conexão com o servidor SMTP
    await transporter.verify();
    console.log('(Servidor) Conexão SMTP verificada com sucesso.');

    const mailOptions = {
      from: process.env.EMAIL_FROM, // 'from' deve vir das variáveis de ambiente
      to: simulado ? emailConfig.testRecipient || 'test@example.com' : config.to, // Usa destinatário de teste se configurado
      subject: `${simulado ? '[SIMULAÇÃO] ' : ''}${config.subject}`,
      text: config.text,
      html: config.html,
      attachments: config.attachments,
    };

    console.log(`(Servidor) Enviando email${simulado ? ' (simulado)' : ''}: De: ${mailOptions.from}, Para: ${mailOptions.to}, Assunto: ${mailOptions.subject}`);
    const info = await transporter.sendMail(mailOptions);

    if (simulado) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('(Servidor) Email de simulação enviado. Preview URL:', previewUrl);
    }

    return {
      success: true,
      message: `(Servidor) Email ${simulado ? 'simulado ' : ''}enviado com sucesso para ${mailOptions.to}. Message ID: ${info.messageId}`,
      previewUrl,
      messageId: info.messageId
    };

  } catch (error: any) {
    console.error('(Servidor) Falha crítica ao enviar email:', error);
    // Retorna uma mensagem de erro mais genérica para evitar expor detalhes
    return {
      success: false,
      message: `(Servidor) Falha ao enviar email. Verifique as configurações e logs do servidor. Erro: ${error.code || error.message}`
    };
  }
}

// Função para gerar o conteúdo HTML do relatório (mantida aqui)
function gerarConteudoHTML(data: RelatorioData): string {
  // ... (lógica idêntica à anterior)
  let html = `<h1>Relatório Diário - ${data.data}</h1>`;
  html += `<p>Total de Alunos: ${data.totalAlunos}</p>`;
  html += `<p>Total Comeram: ${data.totalComeram}</p>`;
  html += `<p>Total Não Comeram: ${data.totalNaoComeram}</p>`;

  if (data.refeicoesPorTipo && Object.keys(data.refeicoesPorTipo).length > 0) {
    html += '<h2>Refeições por Tipo</h2><ul>';
    for (const [tipo, count] of Object.entries(data.refeicoesPorTipo)) {
      html += `<li>${tipo}: ${count}</li>`;
    }
    html += '</ul>';
  }
  
  html += '<h2>Alunos que Comeram</h2>';
  if (data.alunosComeram.length > 0) {
    html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;"><thead><tr><th>Nome</th><th>Turma</th></tr></thead><tbody>';
    data.alunosComeram.forEach(aluno => {
      html += `<tr><td>${aluno.nome}</td><td>${aluno.turma}</td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p>Nenhum aluno comeu neste dia.</p>';
  }

  html += '<h2>Alunos que Não Comeram</h2>';
  if (data.alunosNaoComeram.length > 0) {
    html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;"><thead><tr><th>Nome</th><th>Turma</th></tr></thead><tbody>';
    data.alunosNaoComeram.forEach(aluno => {
      html += `<tr><td>${aluno.nome}</td><td>${aluno.turma}</td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p>Todos os alunos presentes comeram.</p>';
  }
  
  if (data.refeicoes && data.refeicoes.length > 0) {
    html += '<h2>Detalhes das Refeições</h2>';
    html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;"><thead><tr><th>Aluno</th><th>Turma</th><th>Tipo</th><th>Hora</th></tr></thead><tbody>';
    const refeicoesOrdenadas = [...data.refeicoes].sort((a, b) => a.data.getTime() - b.data.getTime());
    refeicoesOrdenadas.forEach(refeicao => {
      const horaFormatada = refeicao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      html += `<tr><td>${refeicao.nomeAluno}</td><td>${refeicao.turma}</td><td>${refeicao.tipo}</td><td>${horaFormatada}</td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p>Nenhuma refeição registrada.</p>';
  }

  return html;
}

// Função para gerar o conteúdo CSV do relatório (mantida aqui)
function gerarConteudoCSV(data: RelatorioData): string {
  // ... (lógica idêntica à anterior)
  let csv = '"Tipo","Nome","Turma","Refeição","Hora"\n'; // Cabeçalho

  data.alunosComeram.forEach(aluno => {
    csv += `"Comeu","${aluno.nome}","${aluno.turma}","-","-"\n`;
  });

  data.alunosNaoComeram.forEach(aluno => {
    csv += `"Não Comeu","${aluno.nome}","${aluno.turma}","-","-"\n`;
  });
  
  if (data.refeicoes) {
    const refeicoesOrdenadas = [...data.refeicoes].sort((a, b) => a.data.getTime() - b.data.getTime());
    refeicoesOrdenadas.forEach(refeicao => {
      const horaFormatada = refeicao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      csv += `"Refeição Detalhe","${refeicao.nomeAluno}","${refeicao.turma}","${refeicao.tipo}","${horaFormatada}"\n`;
    });
  }

  return csv;
}

/**
 * [SERVIDOR] Envia um relatório por email usando a função interna.
 * @param email Email do destinatário
 * @param assunto Assunto do email
 * @param conteudoHTML Conteúdo HTML do email
 * @param anexoCSV Conteúdo do arquivo CSV para anexar (como string)
 */
async function enviarRelatorioEmailServidor(
  email: string,
  assunto: string,
  conteudoHTML: string,
  anexoCSV?: string
): Promise<{ success: boolean; message: string; previewUrl?: string | false; messageId?: string }> {
  if (!email) {
    console.error('[Servidor] Email de destino não fornecido para envio de relatório');
    return { success: false, message: 'Email de destino não fornecido' };
  }

  const anexos = anexoCSV
    ? [
        {
          filename: `relatorio-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(anexoCSV, 'utf-8'),
          contentType: 'text/csv'
        },
      ]
    : undefined;

  const config: EmailConfigServer = {
    to: email,
    subject: assunto,
    html: conteudoHTML,
    attachments: anexos,
  };

  console.log(`(Servidor) Preparando para enviar relatório para ${email}`);
  // Chama diretamente a função de envio do servidor
  return await _enviarEmailServidor(config);
}

/**
 * [SERVIDOR] Gera e envia o relatório diário para os emails fornecidos.
 * @param dadosRelatorio Dados para gerar o relatório.
 * @param emailsDestino Array de emails para enviar o relatório.
 * @returns Promise que resolve quando todos os envios forem tentados.
 */
export async function enviarRelatorioDiario(
  dadosRelatorio: RelatorioData,
  emailsDestino: string[]
): Promise<void> => {
  if (!emailsDestino || emailsDestino.length === 0) {
    console.log('[Servidor] Nenhum email configurado para receber o relatório diário. Abortando envio.');
    return; // Não há o que fazer
  }

  console.log(`[Servidor] Iniciando envio de relatório diário para: ${emailsDestino.join(', ')}`);

  try {
    // Gerar o conteúdo uma vez
    const conteudoHTML = gerarConteudoHTML(dadosRelatorio);
    const conteudoCSV = gerarConteudoCSV(dadosRelatorio);
    const assunto = `Relatório Diário de Refeições - ${dadosRelatorio.data}`;

    // Enviar para cada email configurado
    const enviosPromises = emailsDestino.map(async (email) => {
      try {
        const resultadoEnvio = await enviarRelatorioEmailServidor(email, assunto, conteudoHTML, conteudoCSV);
        if (resultadoEnvio.success) {
          console.log(`[Servidor] Relatório para ${email} enviado com sucesso. Preview: ${resultadoEnvio.previewUrl || 'N/A'}`);
        } else {
          // Logar a falha mas continuar com os outros
          console.error(`[Servidor] Falha ao enviar relatório para ${email}: ${resultadoEnvio.message}`);
        }
      } catch (error) {
        // Captura erros inesperados no envio para um email específico
        console.error(`[Servidor] Erro inesperado ao tentar enviar relatório para ${email}:`, error);
      }
    });

    // Esperar que todos os envios (tentativas) terminem
    await Promise.all(enviosPromises);

    console.log('[Servidor] Processo de envio de relatórios diários concluído.');

  } catch (error) {
    // Captura erros na geração do conteúdo ou outros erros gerais
    console.error('[Servidor] Erro crítico durante o envio do relatório diário:', error);
    // Re-lançar para que a API Route saiba que houve uma falha geral
    throw new Error(`Erro ao processar ou enviar relatório diário: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 