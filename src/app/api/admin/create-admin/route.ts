import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

// Rota para criar ou atualizar o usuário admin no Firestore
export async function GET() {
  try {
    initializeFirebaseAdmin(); // Garante que o SDK Admin está inicializado
    const adminDb = admin.firestore();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

    const email = 'rodrigo.carvalho@jpiaget.com.br';
    const nome = 'Rodrigo Carvalho';
    const cargo = 'Administrador';
    const perfil = 'ADMIN';
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = adminDb.collection('usuarios');
    const q = usuariosRef.where('email', '==', email).limit(1); // Use limit(1) para eficiência
    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
      // Usuário já existe, atualizar
      const usuarioDoc = querySnapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      await adminDb.collection('usuarios').doc(usuarioId).update({
        nome,
        cargo,
        perfil,
        ativo: true,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Usuário admin atualizado com sucesso:', usuarioId);
      return NextResponse.json({
        success: true,
        message: 'Usuário admin atualizado com sucesso',
        id: usuarioId,
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
      });
    } else {
      // Criar o documento do usuário no Firestore
      const novoUsuario = {
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await adminDb.collection('usuarios').add(novoUsuario);
      console.log('Usuário admin criado com sucesso:', docRef.id);
      
      return NextResponse.json({
        success: true,
        message: 'Usuário admin criado com sucesso',
        id: docRef.id,
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
      });
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário admin:', error);
    // Retorna um erro genérico no cliente para segurança
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao processar a solicitação.' },
      { status: 500 },
    );
  }
}
