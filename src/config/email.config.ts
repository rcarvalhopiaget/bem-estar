// Configurações de email
export const emailConfig = {
  // Configurações do SMTP
  smtp: {
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: false, // Forçar conexão não segura
    auth: {
      user: process.env.EMAIL_USER || 'seu-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'sua-senha-ou-app-password',
    },
    tls: {
      // Não verificar certificado
      rejectUnauthorized: false
    }
  },
  // Remetente padrão
  defaultFrom: process.env.EMAIL_FROM || 'Sistema Bem-Estar <bemestar@jpiaget.com.br>',
  // Modo de teste (não envia emails reais)
  testMode: process.env.EMAIL_TEST_MODE === 'true',
};
