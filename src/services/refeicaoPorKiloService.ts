import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  DocumentData,
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RefeicaoPorKilo } from '@/types/refeicao-por-kilo';

const COLLECTION_NAME = 'refeicoesPorKilo';

function converterParaRefeicaoPorKilo(doc: DocumentData): RefeicaoPorKilo {
  const data = doc.data();
  return {
    id: doc.id,
    data: data.data?.toDate ? data.data.toDate() : new Date(data.data),
    quantidade: data.quantidade,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getPorData(data: Date): Promise<RefeicaoPorKilo | null> {
  // Criar uma nova data com o mesmo ano, mês e dia, mas definindo horário para meio-dia
  // para evitar problemas de fuso horário
  const dataBase = new Date(data);
  dataBase.setHours(0, 0, 0, 0);
  
  const inicio = new Date(dataBase);
  const fim = new Date(dataBase);
  fim.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('data', '>=', Timestamp.fromDate(inicio)),
    where('data', '<=', Timestamp.fromDate(fim))
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return converterParaRefeicaoPorKilo(snapshot.docs[0]);
}

export async function getUltimos30Dias(): Promise<RefeicaoPorKilo[]> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);
  dataLimite.setHours(0, 0, 0, 0); // Início do dia, 30 dias atrás

  const q = query(
    collection(db, COLLECTION_NAME),
    where('data', '>=', Timestamp.fromDate(dataLimite)),
    orderBy('data', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(converterParaRefeicaoPorKilo);
}

export async function salvarOuAtualizar(data: Date, quantidade: number): Promise<RefeicaoPorKilo> {
  const dataCorrigida = new Date(data);
  dataCorrigida.setHours(12, 0, 0, 0);
  
  const existente = await getPorData(dataCorrigida);
  const agora = new Date();
  
  if (existente) {
    const ref = doc(db, COLLECTION_NAME, existente.id!);
    await updateDoc(ref, {
      quantidade,
      updatedAt: agora
    });
    return { ...existente, quantidade, updatedAt: agora };
  } else {
    const ref = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(ref, {
      data: dataCorrigida,
      quantidade,
      createdAt: agora,
      updatedAt: agora
    });
    return {
      id: docRef.id,
      data: dataCorrigida,
      quantidade,
      createdAt: agora,
      updatedAt: agora
    };
  }
} 