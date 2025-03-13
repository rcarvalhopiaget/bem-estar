import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

const COLLECTION_NAME = 'restaurante';

export const restauranteService = {
  async buscarConfiguracao() {
    try {
      console.log('Buscando configuração do restaurante...');
      
      // Verifica estado da autenticação
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      // Obtém o token atualizado
      const token = await currentUser.getIdToken(true);
      
      console.log('Estado atual do usuário:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        token: token.substring(0, 20) + '...'
      });

      // Busca o documento de configuração
      const docRef = doc(db, COLLECTION_NAME, 'vFjMLLOfWIlxy7s8kokc');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('Configuração não encontrada, criando...');
        // Cria configuração inicial
        const configInicial = {
          nome: 'Restaurante Escolar',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(docRef, configInicial);
        return configInicial;
      }

      const data = docSnap.data();
      console.log('Configuração encontrada:', data);
      return {
        id: docSnap.id,
        ...data
      };

    } catch (error) {
      console.error('Erro detalhado ao buscar configuração:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      throw new Error('Erro ao buscar configuração do restaurante');
    }
  },

  async atualizarConfiguracao(dados: any) {
    try {
      console.log('Atualizando configuração do restaurante:', dados);
      const docRef = doc(db, COLLECTION_NAME, 'vFjMLLOfWIlxy7s8kokc');
      
      const updateData = {
        ...dados,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      console.log('Configuração atualizada com sucesso');
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw new Error('Erro ao atualizar configuração do restaurante');
    }
  }
}; 