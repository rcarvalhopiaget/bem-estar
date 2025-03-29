'use server'

import { initializeFirebaseAdmin } from '@/lib/firebase/admin'
import * as admin from 'firebase-admin'

interface ActionResult {
  success: boolean
  message: string
  userId?: string
}

export async function upsertRestauranteUser(): Promise<ActionResult> {
  try {
    initializeFirebaseAdmin() // Garante que o SDK Admin está inicializado
    const adminDb = admin.firestore()
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp

    const email = 'restaurante.piaget@jpiaget.com.br'
    const userData = {
      nome: 'Taina Soares',
      email: email, // Incluir email para criação
      perfil: 'OPERADOR',
      ativo: true,
      cargo: 'Operador de Restaurante',
      updatedAt: serverTimestamp(),
    }

    // Verificar se o usuário já existe no Firestore
    const usuariosRef = adminDb.collection('usuarios')
    const q = usuariosRef.where('email', '==', email).limit(1)
    const querySnapshot = await q.get()

    let userId: string
    let message: string

    if (!querySnapshot.empty) {
      // Atualizar o usuário existente
      const usuarioDoc = querySnapshot.docs[0]
      userId = usuarioDoc.id
      await adminDb.collection('usuarios').doc(userId).update({
        ...userData,
        // Não sobrescrever createdAt na atualização
        createdAt: usuarioDoc.data().createdAt || serverTimestamp(), // Manter ou definir se ausente
      })
      message = `Usuário atualizado com sucesso! ID: ${userId}`
      console.log(message)
    } else {
      // Criar um novo usuário
      // Idealmente, criar no Auth também, mas vamos focar no Firestore por agora
      // Usar o email como ID pode ser uma opção, ou gerar um ID
      const newUserRef = await adminDb.collection('usuarios').add({
        ...userData,
        createdAt: serverTimestamp(), // Definir createdAt na criação
      })
      userId = newUserRef.id
      message = `Novo usuário criado com sucesso! ID: ${userId}`
      console.log(message)
    }

    return { success: true, message, userId }
  } catch (error) {
    console.error('Erro na Server Action upsertRestauranteUser:', error)
    return {
      success: false,
      message: `Erro ao criar/atualizar usuário: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
} 