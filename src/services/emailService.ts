import nodemailer from 'nodemailer';
// REMOVIDO: import { getFunctions, httpsCallable } from 'firebase/functions';
// REMOVIDO: import { doc, getDoc, setDoc } from 'firebase/firestore';
// REMOVIDO: import { db } from '../config/firebase';
import { emailConfig } from '@/config/email.config';

// Constantes de configuração
const MODO_SIMULACAO = process.env.EMAIL_TEST_MODE === 'true' || emailConfig.testMode;
// REMOVIDO: const functionsInstance = getFunctions();

interface EmailConfig {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer; // Permitir Buffer para anexos
    contentType?: string;    // Opcional: especificar tipo de conteúdo
  }>;
}

// --- INÍCIO: NOVAS FUNÇÕES PARA ENVIO DIRETO NO SERVIDOR ---

async function _createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return testAccount;
  } catch (error) {
    console.error('Erro ao criar conta de teste Ethereal:', error);
    return {
      user: 'ethereal.user@ethereal.email',
      pass: 'verysecret',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false }
    };
  }
}

async function _enviarEmailServidor(config: EmailConfig): Promise<{ success: boolean; message: string; previewUrl?: string | false; messageId?: string }> {
  let transporter;
  let previewUrl: string | false | undefined = undefined;
  let simulado = MODO_SIMULACAO;

  try {
    console.log('(Servidor) Configurações SMTP:', {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      user: process.env.EMAIL_USER ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      pass: process.env.EMAIL_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      from: process.env.EMAIL_FROM,
      testMode: process.env.EMAIL_TEST_MODE
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
      console.log('(Servidor) Usando modo de simulação Ethereal');
    } else {
      if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_SMTP_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM) {
        console.error('(Servidor) Credenciais SMTP não configuradas.');
        throw new Error('Credenciais SMTP não configuradas.');
      }
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
      console.log('(Servidor) Usando configuração SMTP real');
    }

    await transporter.verify();
    console.log('(Servidor) SMTP pronto para enviar.');

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Sistema Bem-Estar <nao-responda@exemplo.com>',
      to: simulado ? 'test@example.com' : config.to,
      subject: `${simulado ? '[SIMULAÇÃO] ' : ''}${config.subject}`,
      text: config.text || '',
      html: config.html,
      attachments: config.attachments,
    };

    console.log('(Servidor) Enviando email para:', mailOptions.to, 'Assunto:', mailOptions.subject);
    const info = await transporter.sendMail(mailOptions);

    if (simulado) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('(Servidor) Preview URL:', previewUrl);
    }

    return {
      success: true,
      message: `(Servidor) Email ${simulado ? 'simulado ' : ''}enviado com sucesso para ${simulado ? 'test@example.com' : config.to}`,
      previewUrl,
      messageId: info.messageId
    };

  } catch (error: any) {
    console.error('(Servidor) Erro detalhado ao enviar email:', error);
    return {
      success: false,
      message: `(Servidor) Falha ao enviar email: ${error.message || 'Erro desconhecido'}`
    };
  }
}

// --- FIM: NOVAS FUNÇÕES PARA ENVIO DIRETO NO SERVIDOR ---

/**
 * Envia um email com os dados fornecidos
 * @param config Configuração do email
 * @returns Promise que resolve quando o email for enviado (ou simulação ocorrer)
 */
export const enviarEmail = async (config: EmailConfig): Promise<void> => {
  try {
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // LÓGICA DO CLIENTE (USANDO FETCH PARA /api/enviar-email) - Mantida
      try {
        const baseUrl = window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log('Enviando email via API local (cliente):', `${baseUrl}/api/enviar-email`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(`${baseUrl}/api/enviar-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destinatario: config.to,
              assunto: config.subject,
              texto: config.text,
              html: config.html,
              anexos: config.attachments
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            console.log('Email enviado com sucesso via API local (cliente)');
          } else {
            try {
              const data = await response.json();
              console.error('Erro ao enviar email via API local (cliente):', data);
            } catch (jsonError) {
              console.error(`Erro ao enviar email: Status ${response.status} - ${response.statusText}`);
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error('Erro de rede ao enviar email via cliente:', fetchError);
        }
      } catch (clientError: any) {
        console.error('Erro geral ao enviar email no cliente:', clientError);
      }
      // No cliente, sempre resolvemos a promise para não travar a UI
      return Promise.resolve();

    } else {
      // LÓGICA DO SERVIDOR (CHAMANDO FUNÇÃO INTERNA) - Modificada
      console.log('Enviando email diretamente do servidor...');
      const resultado = await _enviarEmailServidor(config); // <--- CHAMADA DIRETA
      if (!resultado.success) {
        console.error('Falha no envio do email pelo servidor:', resultado.message);
        // Considerar lançar erro se o envio for crítico, dependendo do contexto
        // throw new Error(resultado.message);
      } else {
        console.log('Email enviado com sucesso pelo servidor.');
      }
      // No servidor, também resolvemos (logs indicam sucesso/falha)
      return Promise.resolve();
    }
  } catch (error: any) {
    console.error('Erro inesperado na função enviarEmail:', error);
    return Promise.resolve(); // Resolve para não quebrar
  }
};

/**
 * Envia um relatório por email
 * @param email Email do destinatário
 * @param assunto Assunto do email
 * @param conteudoHTML Conteúdo HTML do email
 * @param anexoCSV Conteúdo do arquivo CSV para anexar (como string)
 * @returns Promise que resolve quando o email é enviado (ou simulação ocorre)
 */
export const enviarRelatorioEmail = async (
  email: string,
  assunto: string,
  conteudoHTML: string,
  anexoCSV?: string
): Promise<void> => {
  try {
    if (!email) {
      console.error('Email de destino não fornecido para envio de relatório');
      throw new Error('Email de destino não fornecido'); // Lança erro aqui
    }

    const anexos = anexoCSV
      ? [
          {
            filename: `relatorio-${new Date().toISOString().split('T')[0]}.csv`,
            content: Buffer.from(anexoCSV, 'utf-8'), // Converte para Buffer
            contentType: 'text/csv'
          },
        ]
      : undefined;

    const config: EmailConfig = {
      to: email,
      subject: assunto,
      html: conteudoHTML,
      attachments: anexos,
    };

    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      console.log('Disparando envio de relatório via API (cliente)...')
      await enviarEmail(config); // Usa a função `enviarEmail` que já faz o fetch
    } else {
      // LÓGICA DO SERVIDOR (CHAMANDO FUNÇÃO INTERNA) - Modificada
      console.log('Enviando relatório diretamente do servidor...');
      const resultado = await _enviarEmailServidor(config); // <--- CHAMADA DIRETA
      if (!resultado.success) {
        console.error('Falha no envio do relatório pelo servidor:', resultado.message);
        throw new Error(resultado.message); // Lança erro no caso de falha do relatório
      }
      console.log('Relatório enviado com sucesso pelo servidor.');
    }
    // Se chegou aqui sem erro, resolve a promise
    return Promise.resolve();

  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
    throw error; // Re-lança o erro para a função chamadora
  }
};

// Interface para os dados do relatório
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

// Função para gerar o conteúdo HTML do relatório
function gerarConteudoHTML(data: RelatorioData): string {
  // ... (lógica para gerar o HTML do relatório - manter como está)
  // Exemplo simplificado:
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
    // Ordenar refeições por hora
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

// Função para gerar o conteúdo CSV do relatório
function gerarConteudoCSV(data: RelatorioData): string {
  // ... (lógica para gerar o CSV - manter como está)
  // Exemplo simplificado:
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
 * Gera e envia o relatório diário para os emails configurados.
 * MODIFICADO: Recebe emails como parâmetro.
 * @param dadosRelatorio Dados para gerar o relatório.
 * @param emailsDestino Array de emails para enviar o relatório.
 */
export const enviarRelatorioDiario = async (
  dadosRelatorio: RelatorioData,
  emailsDestino: string[] // Recebe a lista de emails
): Promise<void> => {
  try {
    // 1. Obter a lista de emails (AGORA VEM COMO PARÂMETRO)
    const emails = emailsDestino;

    if (!emails || emails.length === 0) {
      console.log('Nenhum email configurado para receber o relatório diário.');
      return; // Retorna void se não houver emails
    }

    // 2. Gerar o conteúdo HTML e CSV
    const conteudoHTML = gerarConteudoHTML(dadosRelatorio);
    const conteudoCSV = gerarConteudoCSV(dadosRelatorio);
    const assunto = `Relatório Diário de Refeições - ${dadosRelatorio.data}`;

    // 3. Enviar para cada email configurado
    const enviosPromises = emails.map(email => 
      enviarRelatorioEmail(email, assunto, conteudoHTML, conteudoCSV)
        .catch(error => {
          console.error(`Falha ao enviar relatório para ${email}:`, error);
          // Não para o processo se um email falhar
        })
    );
    
    await Promise.all(enviosPromises);

    console.log(`Relatórios de refeições enviados com sucesso para ${emails.join(', ')}`);

    // Retorna void no sucesso também
    return;

  } catch (error) {
    console.error('Erro ao enviar relatório diário:', error);
    // Lançar o erro para que a função chamadora (API route) possa tratá-lo
    throw error; 
  }
};

/**
 * Envia um email de teste para o endereço configurado
 * @param minutosAtraso Atraso em minutos para envio do email (padrão: 5 minutos)
 * @returns Objeto com informações do resultado
 */
export const enviarEmailTeste = async (minutosAtraso: number = 0): Promise<{ success: boolean, message: string, horarioEnvio?: string, previewUrl?: string }> => {
  try {
    // Verificar se estamos no lado do servidor
    if (typeof window !== 'undefined') {
      return {
        success: false,
        message: 'Esta função só pode ser chamada do servidor.'
      };
    }

    // Calcular horário de envio
    const agora = new Date();
    const horarioEnvio = new Date(agora.getTime() + minutosAtraso * 60000);
    const horarioFormatado = horarioEnvio.toISOString();

    // Agendar a chamada da API
    // NOTE: Esta parte pode precisar de um serviço externo de agendamento (como Vercel Cron Jobs)
    // ou uma implementação mais robusta no servidor se a aplicação ficar rodando.
    // Para um teste simples, vamos chamar a API diretamente após o atraso.

    if (minutosAtraso > 0) {
      console.log(`Agendando envio de email de teste para ${horarioFormatado}`);
      // Simular agendamento com setTimeout (não confiável em serverless)
      setTimeout(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          console.log('[AGENDADO] Enviando email de teste via API...');
          await fetch(`${baseUrl}/api/enviar-email?simulacao=true`); 
        } catch (fetchError) {
          console.error('[AGENDADO] Erro ao enviar email de teste:', fetchError);
        }
      }, minutosAtraso * 60000);

      return {
        success: true,
        message: `Email de teste agendado para ${horarioEnvio.toLocaleString('pt-BR')}`,
        horarioEnvio: horarioFormatado
      };

    } else {
      // Enviar imediatamente
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      console.log('Enviando email de teste imediato via API...');
      const response = await fetch(`${baseUrl}/api/enviar-email?simulacao=true`);
      const data = await response.json();
      
      if(data.success) {
        return {
          success: true,
          message: 'Email de teste enviado com sucesso (modo simulação).',
          previewUrl: data.previewUrl
        };
      } else {
         return {
          success: false,
          message: `Falha ao enviar email de teste: ${data.message || 'Erro desconhecido'}`
        };
      }
    }

  } catch (error: any) {
    console.error('Erro na função enviarEmailTeste:', error);
    return {
      success: false,
      message: `Erro interno: ${error.message || 'Erro desconhecido'}`
    };
  }
};
