'use server';

import { cookies } from 'next/headers';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase'; // Ajuste o caminho se necessário
import { initializeFirebaseAdmin } from '@/lib/firebase/admin'; // Ajuste o caminho se necessário
import * as admin from 'firebase-admin';

// Função auxiliar para obter o UID do usuário logado a partir do cookie de sessão
async function getUserIdFromSession(): Promise<string | null> {
  const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    console.log('[NotificationActions] Cookie de sessão não encontrado.');
    return null;
  }

  try {
    const adminApp = initializeFirebaseAdmin();
    const decodedClaims = await admin.auth(adminApp).verifySessionCookie(sessionCookie, true); // true = checkRevoked
    return decodedClaims.uid;
  } catch (error: any) {
    // Log específico para token inválido/expirado pode ser útil
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
      console.log(`[NotificationActions] Cookie de sessão inválido (${error.code}).`);
    } else {
      console.error('[NotificationActions] Erro ao verificar cookie de sessão:', error);
    }
    return null;
  }
}

// Interface para o tipo de retorno (evitar retornar Timestamps diretamente para o cliente)
export interface NotificationData {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // Convertido para ISO string para serialização
  link?: string;
  eventType?: string;
  senderUserId?: string;
  metadata?: Record<string, any>;
}

// Busca as notificações não lidas mais recentes
export async function getUnreadNotifications(): Promise<NotificationData[]> {
  const userId = await getUserIdFromSession();
  if (!userId) {
    console.warn('[getUnreadNotifications] Usuário não autenticado.');
    return []; // Retorna vazio se não autenticado
  }
  if (!db) {
     console.error('[getUnreadNotifications] Firestore DB não inicializado.');
     return [];
  }

  console.log(`[getUnreadNotifications] Buscando notificações para usuário: ${userId}`);

  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientUserId', '==', userId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(15) // Limita para performance, ajuste se necessário
    );

    const snapshot = await getDocs(q);
    console.log(`[getUnreadNotifications] Encontradas ${snapshot.docs.length} notificações não lidas.`);

    // Mapeia e converte Timestamp para string ISO
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        ...data,
        createdAt: createdAtTimestamp?.toDate().toISOString() || new Date().toISOString(), // Fallback se timestamp estiver ausente
      } as NotificationData;
    });

  } catch (error) {
    console.error("[getUnreadNotifications] Erro ao buscar notificações não lidas:", error);
    return []; // Retorna vazio em caso de erro
  }
}

// Marca uma notificação específica como lida
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: 'Usuário não autenticado.' };
  if (!db) return { success: false, error: 'Firestore DB não inicializado.' };
  if (!notificationId) return { success: false, error: 'ID da notificação não fornecido.' };

  console.log(`[markNotificationAsRead] Usuário ${userId} marcando notificação ${notificationId} como lida.`);

  try {
    const notificationRef = doc(db, 'notifications', notificationId);

    // Opcional, mas recomendado: Verificar se a notificação pertence ao usuário
    const docSnap = await getDoc(notificationRef);
    if (!docSnap.exists()) {
        console.warn(`[markNotificationAsRead] Notificação ${notificationId} não encontrada.`);
        return { success: false, error: 'Notificação não encontrada.' };
    }
    if (docSnap.data()?.recipientUserId !== userId) {
        console.warn(`[markNotificationAsRead] Usuário ${userId} tentou marcar notificação ${notificationId} que não lhe pertence.`);
        return { success: false, error: 'Acesso negado à notificação.' };
    }

    await updateDoc(notificationRef, { isRead: true });
    console.log(`[markNotificationAsRead] Notificação ${notificationId} marcada como lida com sucesso.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[markNotificationAsRead] Erro ao marcar notificação ${notificationId} como lida:`, error);
    return { success: false, error: error.message || 'Erro ao atualizar notificação.' };
  }
}

// Marca todas as notificações do usuário como lidas
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: 'Usuário não autenticado.' };
  if (!db) return { success: false, error: 'Firestore DB não inicializado.' };

  console.log(`[markAllNotificationsAsRead] Usuário ${userId} marcando todas as notificações como lidas.`);

  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientUserId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`[markAllNotificationsAsRead] Nenhuma notificação não lida encontrada para ${userId}.`);
      return { success: true }; // Nenhuma para marcar
    }

    console.log(`[markAllNotificationsAsRead] Marcando ${snapshot.docs.length} notificações como lidas para ${userId}.`);
    // Usar batch para eficiência ao atualizar múltiplos documentos
    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
      batch.update(document.ref, { isRead: true });
    });

    await batch.commit();
    console.log(`[markAllNotificationsAsRead] Todas as notificações não lidas para ${userId} marcadas com sucesso.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[markAllNotificationsAsRead] Erro ao marcar todas as notificações como lidas para ${userId}:`, error);
    return { success: false, error: error.message || 'Erro ao atualizar notificações.' };
  }
}
