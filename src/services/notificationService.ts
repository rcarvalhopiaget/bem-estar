import { db } from '@/config/firebase'; // Ajuste o caminho se necessário
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Interface para os dados de entrada ao criar uma notificação
export interface NotificationInput {
  recipientUserId: string;
  title: string;
  message: string;
  link?: string;
  eventType?: 'NEW_USER' | 'TASK_ASSIGNMENT' | 'ADMIN_ACTION' | 'DATA_UPDATE' | 'GENERAL';
  senderUserId?: string;
  metadata?: Record<string, any>;
}

/**
 * Cria um novo documento de notificação no Firestore.
 * @param data - Os dados da notificação a ser criada.
 */
export async function createNotification(data: NotificationInput): Promise<void> {
  // Verifica se o DB está inicializado (importante!)
  if (!db) {
    console.error('[NotificationService] Firestore não está inicializado ao tentar criar notificação.');
    // Decide se quer lançar um erro ou apenas logar.
    // Lançar pode interromper o fluxo principal (ex: criação de usuário).
    // Por segurança, apenas loga e retorna para não quebrar operações essenciais.
    return;
  }

  try {
    // Adiciona um novo documento à coleção 'notifications'
    await addDoc(collection(db, 'notifications'), {
      ...data, // Espalha os dados recebidos
      isRead: false, // Notificações sempre começam como não lidas
      createdAt: serverTimestamp(), // Usa o timestamp do servidor Firebase para a data de criação
    });
    console.log(`[NotificationService] Notificação do tipo '${data.eventType || 'GENERAL'}' criada para ${data.recipientUserId}`);
  } catch (error) {
    console.error('[NotificationService] Erro ao criar documento de notificação no Firestore:', error);
    // Loga o erro, mas geralmente não relança para não quebrar a operação principal.
    // Em cenários críticos, você pode querer relançar ou tratar de outra forma.
  }
}