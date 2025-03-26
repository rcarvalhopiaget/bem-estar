require('dotenv').config();
const nodemailer = require('nodemailer');

// This function simulates fetching meal records from the database.
// Replace this function with actual database query in production.
async function fetchDailyMeals() {
  // For demonstration, we return dummy meal records. Each record has studentName and mealTime.
  // In production, query your database (e.g., Firestore) filtering by today's date.
  return [
    { studentName: 'João Silva', mealTime: '12:00' },
    { studentName: 'Maria Oliveira', mealTime: '12:15' },
    { studentName: 'Carlos Souza', mealTime: '12:30' }
  ];
}

// Utility function to format the meal records into a report
function formatMealReport(meals) {
  if (meals.length === 0) {
    return 'Nenhuma refeição foi registrada hoje.';
  }
  let report = 'Relatório Diário de Refeições\n\n';
  report += 'Total de refeições: ' + meals.length + '\n\n';
  meals.forEach((meal, index) => {
    report += (index + 1) + '. ' + meal.studentName + ' - ' + meal.mealTime + '\n';
  });
  return report;
}

// Simulated function to fetch report details from database
async function fetchDailyReportDetails() {
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      // Usar o arquivo de configuração do Firebase para inicializar o app
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    const db = admin.firestore();

    // Fetch all alunos from Firestore
    const alunosSnap = await db.collection('alunos').get();
    const alunos = [];
    alunosSnap.forEach(doc => {
      alunos.push({ id: doc.id, ...doc.data() });
    });
    const totalStudents = alunos.length;

    // Get today's date in yyyy-mm-dd format
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    // Fetch refeicoes (meals) for today from Firestore
    const refeicoesSnap = await db.collection('refeicoes').where('date', '==', todayStr).get();
    const refeicoes = [];
    refeicoesSnap.forEach(doc => {
      refeicoes.push(doc.data());
    });

    // Determine which students have ate and count meals by type
    const ateStudentIds = new Set();
    const mealsByType = {
      'Almoço': 0,
      'Lanche da Manhã': 0,
      'Lanche da Tarde': 0
    };
    refeicoes.forEach(r => {
      if (r.studentId) {
        ateStudentIds.add(r.studentId);
      }
      if (r.type in mealsByType) {
        mealsByType[r.type]++;
      }
    });

    // Ordenar alunos por turma e nome para melhor visualização
    const ateList = [];
    const notAteList = [];
    alunos.forEach(a => {
      if (ateStudentIds.has(a.id)) {
        ateList.push({ studentName: a.nome, class: a.turma, tipo: a.tipo || 'Não especificado' });
      } else {
        notAteList.push({ studentName: a.nome, class: a.turma, tipo: a.tipo || 'Não especificado' });
      }
    });

    // Ordenar por turma e depois por nome
    ateList.sort((a, b) => a.class.localeCompare(b.class) || a.studentName.localeCompare(b.studentName));
    notAteList.sort((a, b) => a.class.localeCompare(b.class) || a.studentName.localeCompare(b.studentName));

    const ateCount = ateList.length;
    const notAteCount = notAteList.length;

    // Format today's date as dd/mm/yyyy
    const reportDate = today.getDate().toString().padStart(2, '0') + '/' +
                       (today.getMonth() + 1).toString().padStart(2, '0') + '/' +
                       today.getFullYear();

    const generationDateTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return {
      reportDate,
      totalStudents,
      ateCount,
      notAteCount,
      mealsByType,
      ateList,
      notAteList,
      generationDateTime
    };
  } catch (error) {
    console.error('Erro ao consultar Firestore:', error);
    // Retornar dados dummy em caso de erro
    return {
      reportDate: new Date().toLocaleDateString('pt-BR'),
      totalStudents: 0,
      ateCount: 0,
      notAteCount: 0,
      mealsByType: {
        'Almoço': 0,
        'Lanche da Manhã': 0,
        'Lanche da Tarde': 0
      },
      ateList: [],
      notAteList: [],
      generationDateTime: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };
  }
}

// Function to generate CSV content based on report details
function generateCSVReport(details) {
  // Usar ponto e vírgula como separador para melhor compatibilidade com Excel brasileiro
  let csv = '';
  
  // Cabeçalho do relatório
  csv += `Relatório de Refeições - ${details.reportDate}\r\n`;
  csv += `Gerado em: ${details.generationDateTime}\r\n\r\n`;
  
  // Resumo
  csv += 'RESUMO\r\n';
  csv += `Total de alunos;${details.totalStudents}\r\n`;
  const atePercentage = ((details.ateCount / details.totalStudents) * 100).toFixed(1);
  const notAtePercentage = ((details.notAteCount / details.totalStudents) * 100).toFixed(1);
  csv += `Alunos que comeram;${details.ateCount};${atePercentage}%\r\n`;
  csv += `Alunos que não comeram;${details.notAteCount};${notAtePercentage}%\r\n\r\n`;
  
  // Refeições por tipo
  csv += 'REFEIÇÕES POR TIPO\r\n';
  csv += `Almoço;${details.mealsByType['Almoço']}\r\n`;
  csv += `Lanche da Manhã;${details.mealsByType['Lanche da Manhã']}\r\n`;
  csv += `Lanche da Tarde;${details.mealsByType['Lanche da Tarde']}\r\n\r\n`;
  
  // Lista de alunos que comeram
  csv += 'ALUNOS QUE COMERAM\r\n';
  csv += 'Nome;Turma;Tipo\r\n';
  details.ateList.forEach(item => {
    csv += `${item.studentName};${item.class};${item.tipo}\r\n`;
  });
  csv += '\r\n';
  
  // Lista de alunos que não comeram
  csv += 'ALUNOS QUE NÃO COMERAM\r\n';
  csv += 'Nome;Turma;Tipo\r\n';
  details.notAteList.forEach(item => {
    csv += `${item.studentName};${item.class};${item.tipo}\r\n`;
  });
  
  return csv;
}

// Updated function to send detailed daily report email with CSV attachment
async function sendDailyReportEmail() {
  try {
    // Fetch today's report details
    const details = await fetchDailyReportDetails();
    const atePercentage = ((details.ateCount / details.totalStudents) * 100).toFixed(1);
    const notAtePercentage = ((details.notAteCount / details.totalStudents) * 100).toFixed(1);

    // Construct the email body with detailed report info and HTML formatting
    const reportBody = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
    .ate { color: #27ae60; }
    .not-ate { color: #e74c3c; }
  </style>
</head>
<body>
  <h1>Relatório de Refeições - ${details.reportDate}</h1>
  
  <div class="summary">
    <h2>Resumo</h2>
    <p><strong>Total de alunos:</strong> ${details.totalStudents}</p>
    <p><strong>Alunos que comeram:</strong> <span class="ate">${details.ateCount} (${atePercentage}%)</span></p>
    <p><strong>Alunos que não comeram:</strong> <span class="not-ate">${details.notAteCount} (${notAtePercentage}%)</span></p>
  </div>
  
  <h2>Refeições por tipo</h2>
  <table>
    <tr>
      <th>Tipo</th>
      <th>Quantidade</th>
    </tr>
    <tr>
      <td>Almoço</td>
      <td>${details.mealsByType['Almoço']}</td>
    </tr>
    <tr>
      <td>Lanche da Manhã</td>
      <td>${details.mealsByType['Lanche da Manhã']}</td>
    </tr>
    <tr>
      <td>Lanche da Tarde</td>
      <td>${details.mealsByType['Lanche da Tarde']}</td>
    </tr>
  </table>
  
  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo Sistema Bem-Estar.</p>
    <p>Data e hora de geração: ${details.generationDateTime}</p>
    <p>Para mais detalhes, consulte o arquivo CSV anexo.</p>
  </div>
</body>
</html>
`;

    // Generate CSV report content
    const csvContent = generateCSVReport(details);

    // Create a transporter using SMTP details from .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Define email options with CSV attachment
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'rodrigo.carvalho@jpiaget.com.br, bemestar@jpiaget.com.br',
      subject: `Relatório de Refeições - ${details.reportDate}`,
      html: reportBody,
      attachments: [
        {
          filename: `relatorio_refeicoes_${details.reportDate.replace(/\//g, '-')}.csv`,
          content: csvContent,
          contentType: 'text/csv; charset=utf-8'
        }
      ]
    };

    // Check if test mode is enabled
    if (process.env.EMAIL_TEST_MODE === 'true') {
      console.log('Modo teste ativado. Email não será enviado.\nConteúdo do email:\n', mailOptions);
      return;
    }

    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);
  } catch (error) {
    console.error('Erro ao enviar relatorio diario:', error);
  }
}

if (require.main === module) {
  sendDailyReportEmail();
}

module.exports = { sendDailyReportEmail };
