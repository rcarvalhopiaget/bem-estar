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
    const { Timestamp } = require('firebase-admin/firestore');

    if (!admin.apps.length) {
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    const db = admin.firestore();

    // Fetch all alunos ativos from Firestore
    const alunosSnap = await db.collection('alunos').where('ativo', '==', true).get();
    const alunos = [];
    alunosSnap.forEach(doc => {
      alunos.push({ id: doc.id, ...doc.data() });
    });
    const totalStudents = alunos.length;

    // Get today's date and calculate start/end Timestamps
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    // Fetch refeicoes (meals) for today from Firestore using a date range query
    const refeicoesSnap = await db.collection('refeicoes')
                                  .where('data', '>=', startOfDayTimestamp)
                                  .where('data', '<=', endOfDayTimestamp)
                                  .get();
    const refeicoes = [];
    refeicoesSnap.forEach(doc => {
      const docData = doc.data();
      if (docData.data && docData.data.toDate) {
        refeicoes.push({ ...docData, id: doc.id }); 
      } else {
        console.warn(`Documento ${doc.id} na coleção 'refeicoes' não possui campo 'data' válido.`);
      }
    });
    
    console.log(`[sendDailyReport] Buscando refeições entre ${startOfDay.toISOString()} e ${endOfDay.toISOString()}`);
    console.log(`[sendDailyReport] Encontradas ${refeicoes.length} refeições.`);

    // Determine which students have ate, count meals by type, and count avulsos
    const ateStudentIds = new Set();
    let avulsoCount = 0;
    const mealsByType = {
      'Almoço': 0,
      'Lanche da Manhã': 0,
      'Lanche da Tarde': 0,
      'Sopa': 0
    };
    
    refeicoes.forEach(r => {
      if (r.presente === true) { 
        if (r.alunoId) { 
          ateStudentIds.add(r.alunoId);
        }
        const tipoRefeicaoFormatado = formatarTipoRefeicao(r.tipo);
        if (tipoRefeicaoFormatado in mealsByType) {
          mealsByType[tipoRefeicaoFormatado]++;
        }
        if (r.isAvulso === true) {
          avulsoCount++;
        }
      }
    });
    
    console.log(`[sendDailyReport] IDs de alunos que comeram: ${Array.from(ateStudentIds).join(', ')}`);
    console.log(`[sendDailyReport] Refeições por tipo:`, mealsByType);
    console.log(`[sendDailyReport] Refeições avulsas contadas: ${avulsoCount}`);

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
    ateList.sort((a, b) => (a.class || '').localeCompare(b.class || '') || a.studentName.localeCompare(b.studentName));
    notAteList.sort((a, b) => (a.class || '').localeCompare(b.class || '') || a.studentName.localeCompare(b.studentName));

    const ateCount = ateStudentIds.size;
    const notAteCount = totalStudents - ateCount;

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
      generationDateTime,
      avulsoCount
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
        'Lanche da Tarde': 0,
        'Sopa': 0
      },
      ateList: [],
      notAteList: [],
      generationDateTime: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      avulsoCount: 0
    };
  }
}

// Adicionar função auxiliar se não existir em outro lugar
function formatarTipoRefeicao(tipo) {
  switch (tipo?.toUpperCase()) {
    case 'ALMOCO':
      return 'Almoço';
    case 'LANCHE_MANHA':
      return 'Lanche da Manhã';
    case 'LANCHE_TARDE':
      return 'Lanche da Tarde';
    case 'SOPA':
        return 'Sopa';
    default:
      // Retornar o tipo original ou um valor padrão se não reconhecido
      return tipo || 'Desconhecido'; 
  }
}

// Function to generate CSV content based on report details
function generateCSVReport(details) {
  let csv = '';
  
  csv += `Relatório de Refeições - ${details.reportDate}\r\n`;
  csv += `Gerado em: ${details.generationDateTime}\r\n\r\n`;
  
  csv += 'RESUMO\r\n';
  csv += `Total de alunos;${details.totalStudents}\r\n`;
  const atePercentage = details.totalStudents > 0 ? ((details.ateCount / details.totalStudents) * 100).toFixed(1) : '0.0';
  const notAtePercentage = details.totalStudents > 0 ? ((details.notAteCount / details.totalStudents) * 100).toFixed(1) : '0.0';
  csv += `Alunos que comeram;${details.ateCount};${atePercentage}%\r\n`;
  csv += `Alunos que não comeram;${details.notAteCount};${notAtePercentage}%\r\n`;
  csv += `Refeições Avulsas Registradas;${details.avulsoCount}\r\n\r\n`;
  
  csv += 'REFEIÇÕES POR TIPO\r\n';
  csv += `Almoço;${details.mealsByType['Almoço'] || 0}\r\n`; 
  csv += `Lanche da Manhã;${details.mealsByType['Lanche da Manhã'] || 0}\r\n`;
  csv += `Lanche da Tarde;${details.mealsByType['Lanche da Tarde'] || 0}\r\n`;
  csv += `Sopa;${details.mealsByType['Sopa'] || 0}\r\n\r\n`; 
  
  csv += 'ALUNOS QUE COMERAM\r\n';
  csv += 'Nome;Turma;Tipo\r\n';
  details.ateList.forEach(item => {
    csv += `${item.studentName};${item.class};${item.tipo}\r\n`;
  });
  csv += '\r\n';
  
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
    const details = await fetchDailyReportDetails();
    const atePercentage = details.totalStudents > 0 ? ((details.ateCount / details.totalStudents) * 100).toFixed(1) : '0.0';
    const notAtePercentage = details.totalStudents > 0 ? ((details.notAteCount / details.totalStudents) * 100).toFixed(1) : '0.0';

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
    .avulso { color: #f39c12; }
  </style>
</head>
<body>
  <h1>Relatório de Refeições - ${details.reportDate}</h1>
  
  <div class="summary">
    <h2>Resumo</h2>
    <p><strong>Total de alunos ativos:</strong> ${details.totalStudents}</p>
    <p><strong>Alunos que comeram:</strong> <span class="ate">${details.ateCount} (${atePercentage}%)</span></p>
    <p><strong>Alunos que não comeram:</strong> <span class="not-ate">${details.notAteCount} (${notAtePercentage}%)</span></p>
    <p><strong>Refeições Avulsas Registradas:</strong> <span class="avulso">${details.avulsoCount}</span></p>
  </div>
  
  <h2>Refeições por tipo</h2>
  <table>
    <tr>
      <th>Tipo</th>
      <th>Quantidade</th>
    </tr>
    <tr>
      <td>Almoço</td>
      <td>${details.mealsByType['Almoço'] || 0}</td>
    </tr>
    <tr>
      <td>Lanche da Manhã</td>
      <td>${details.mealsByType['Lanche da Manhã'] || 0}</td>
    </tr>
    <tr>
      <td>Lanche da Tarde</td>
      <td>${details.mealsByType['Lanche da Tarde'] || 0}</td>
    </tr>
    <tr>
      <td>Sopa</td>
      <td>${details.mealsByType['Sopa'] || 0}</td>
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

    const csvContent = generateCSVReport(details);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const recipients = process.env.DAILY_REPORT_RECIPIENTS.split(',').map(email => email.trim());

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipients.join(','),
      subject: `Relatório Diário de Refeições - ${details.reportDate}`,
      html: reportBody,
      attachments: [
        {
          filename: `relatorio_refeicoes_${details.reportDate.replace(/\//g, '-')}.csv`,
          content: csvContent,
          contentType: 'text/csv; charset=utf-8'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email do relatório diário enviado com sucesso para ${recipients.join(', ')}`);
  } catch (error) {
    console.error('Falha ao enviar email do relatório diário:', error);
  }
}

if (require.main === module) {
  sendDailyReportEmail();
}

module.exports = { sendDailyReportEmail, fetchDailyReportDetails };
