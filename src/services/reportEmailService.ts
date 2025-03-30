import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'report_email_recipients';

export interface ReportEmailRecipient {
  id?: string;
  email: string;
  name?: string;
  active: boolean;
  createdAt: Date;
}

export async function addReportEmailRecipient(data: Omit<ReportEmailRecipient, 'id' | 'createdAt'>): Promise<string> {
  try {
    // Verificar se o email já existe na coleção
    const existingQuery = query(
      collection(db, COLLECTION_NAME),
      where('email', '==', data.email)
    );
    
    const existingDocs = await getDocs(existingQuery);
    if (!existingDocs.empty) {
      throw new Error('Este email já está cadastrado para receber relatórios');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar destinatário de email:', error);
    throw error;
  }
}

export async function getReportEmailRecipients(): Promise<ReportEmailRecipient[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const recipients: ReportEmailRecipient[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recipients.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        active: data.active,
        createdAt: data.createdAt.toDate()
      });
    });
    
    // Ordenar por data de criação, mais recentes primeiro
    return recipients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Erro ao buscar destinatários de email:', error);
    throw error;
  }
}

export async function removeReportEmailRecipient(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao remover destinatário de email:', error);
    throw error;
  }
}

export async function toggleReportEmailRecipientStatus(id: string, active: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { active });
  } catch (error) {
    console.error('Erro ao atualizar status do destinatário:', error);
    throw error;
  }
} 