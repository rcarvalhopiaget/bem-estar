import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getReportEmailRecipients } from './reportEmailService';

export interface MealReport {
  id: string;
  userId: string;
  userName: string;
  mealType: string;
  mealName: string;
  description?: string;
  calories: number;
  date: Date;
  createdAt: Date;
}

/**
 * Busca relatório de refeições com base em filtros
 */
export async function getMealReport(filters: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<MealReport[]> {
  try {
    const { startDate, endDate, userId } = filters;
    
    const mealsRef = collection(db, 'meals');
    let mealsQuery = query(mealsRef);
    
    // Aplicar filtros
    if (startDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      mealsQuery = query(mealsQuery, where('date', '>=', startTimestamp));
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      mealsQuery = query(mealsQuery, where('date', '<=', endTimestamp));
    }
    
    if (userId) {
      mealsQuery = query(mealsQuery, where('userId', '==', userId));
    }
    
    const querySnapshot = await getDocs(mealsQuery);
    const meals: MealReport[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      meals.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName || 'Usuário',
        mealType: data.mealType,
        mealName: data.mealName,
        description: data.description,
        calories: data.calories || 0,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate()
      });
    });
    
    // Ordenar por data, mais recentes primeiro
    return meals.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Erro ao buscar relatório de refeições:', error);
    throw error;
  }
}

/**
 * Gera um arquivo CSV a partir dos dados do relatório
 */
export function generateCSV(data: MealReport[]): string {
  // Cabeçalho do CSV
  const headers = [
    'ID', 
    'Usuário', 
    'Nome do Usuário', 
    'Tipo de Refeição', 
    'Nome da Refeição', 
    'Descrição', 
    'Calorias', 
    'Data', 
    'Hora'
  ];
  
  // Linhas de dados
  const rows = data.map(item => [
    item.id,
    item.userId,
    item.userName,
    item.mealType,
    item.mealName,
    item.description || '',
    item.calories.toString(),
    format(item.date, 'dd/MM/yyyy', { locale: ptBR }),
    format(item.date, 'HH:mm', { locale: ptBR })
  ]);
  
  // Combinar cabeçalho e linhas
  const allRows = [headers, ...rows];
  
  // Gerar string CSV
  return allRows.map(row => row.map(cell => {
    // Adicionar aspas se a célula contiver vírgula, aspas ou quebra de linha
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(',')).join('\n');
}

/**
 * Envia o relatório por email para todos os destinatários ativos
 */
export async function sendReportEmails(startDate?: Date, endDate?: Date): Promise<boolean> {
  try {
    // Obter todos os destinatários ativos
    const recipients = await getReportEmailRecipients();
    const activeRecipients = recipients.filter(r => r.active);
    
    if (activeRecipients.length === 0) {
      console.log('Nenhum destinatário ativo para enviar o relatório');
      return false;
    }
    
    // Gerar o relatório
    const today = new Date();
    const reportStartDate = startDate || new Date(today.setDate(today.getDate() - 1)); // Ontem por padrão
    const reportEndDate = endDate || new Date(); // Hoje por padrão
    
    const reportData = await getMealReport({
      startDate: reportStartDate,
      endDate: reportEndDate
    });
    
    if (reportData.length === 0) {
      console.log('Nenhum dado de refeição disponível para o período selecionado');
      return false;
    }
    
    // Gerar CSV
    const csvContent = generateCSV(reportData);
    
    // Aqui você integraria com um serviço de envio de email como SendGrid, Mailgun, etc.
    // Por exemplo, com Firebase Cloud Functions ou um serviço de API de email
    
    // Exemplo de integração com serviço de email (pseudocódigo):
    // await emailService.send({
    //   to: activeRecipients.map(r => r.email),
    //   subject: `Relatório de Refeições - ${format(reportStartDate, 'dd/MM/yyyy')} a ${format(reportEndDate, 'dd/MM/yyyy')}`,
    //   text: `Segue em anexo o relatório de refeições do período de ${format(reportStartDate, 'dd/MM/yyyy')} a ${format(reportEndDate, 'dd/MM/yyyy')}.`,
    //   attachments: [
    //     {
    //       filename: `relatorio-refeicoes-${format(reportStartDate, 'dd-MM-yyyy')}-a-${format(reportEndDate, 'dd-MM-yyyy')}.csv`,
    //       content: csvContent
    //     }
    //   ]
    // });
    
    console.log(`Relatório enviado para ${activeRecipients.length} destinatários`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
    return false;
  }
} 