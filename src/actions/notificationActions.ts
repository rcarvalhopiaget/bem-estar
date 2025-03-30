'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/firebase';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export async function getUnreadNotifications(): Promise<NotificationData[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      return [];
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.email),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: data.isRead,
        createdAt: data.createdAt.toDate(),
      });
    });

    return notifications;
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error('Usuário não autenticado');
    }

    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { success: false, error: 'Falha ao marcar notificação como lida' };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error('Usuário não autenticado');
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.email),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      
      querySnapshot.forEach((document) => {
        batch.update(doc(db, 'notifications', document.id), { isRead: true });
      });
      
      await batch.commit();
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return { success: false, error: 'Falha ao marcar notificações como lidas' };
  }
} 