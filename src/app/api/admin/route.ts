import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

// Rota para criar um usuário admin (Auth e Firestore) se não existir
export async function GET() {
  try {
    initializeFirebaseAdmin(); // Garante que o SDK Admin está inicializado
    const adminDb = admin.firestore();
    const adminAuth = admin.auth();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

    const email = 'rodrigo.carvalho@jpiaget.com.br';
    const senha = 'Senha@123'; // Defina uma senha segura ou gere aleatoriamente
    const nome = 'Rodrigo Carvalho';
    const cargo = 'Administrador';
    const perfil = 'ADMIN';

    let userId = '';
    let userExistsInAuth = false;
    let userExistsInFirestore = false;

    // 1. Verificar se o usuário existe no Firebase Auth
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      userId = userRecord.uid;
      userExistsInAuth = true;
      console.log('Usuário já existe no Auth:', userId);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('Usuário não encontrado no Auth, será criado.');
        // Se não existe no Auth, criar
        const newUserRecord = await adminAuth.createUser({
          email: email,
          emailVerified: true, // Pode definir como false se enviar email de verificação
          password: senha,
          displayName: nome,
          disabled: false,
        });
        userId = newUserRecord.uid;
        console.log('Usuário criado no Auth com sucesso:', userId);
      } else {
        // Outro erro no Auth
        throw error;
      }
    }

    // 2. Verificar se o usuário já existe no Firestore
    const usuariosRef = adminDb.collection('usuarios');
    const q = usuariosRef.where('email', '==', email).limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      // Usuário já existe no Firestore
      const usuarioDoc = querySnapshot.docs[0];
      userExistsInFirestore = true;
      // Garante que o ID do Firestore corresponda ao ID do Auth se possível
      if (userId && usuarioDoc.id !== userId) {
        console.warn(
          `ID do Firestore (${usuarioDoc.id}) diferente do ID do Auth (${userId}). Isso pode indicar inconsistência.`,
        );
        // Aqui você pode decidir como lidar com a inconsistência
        // Ex: Atualizar o documento Firestore com o UID do Auth
        // await adminDb.collection('usuarios').doc(usuarioDoc.id).update({ authUid: userId });
      } else if (!userId) {
        // Se não tínhamos o userId do Auth antes (improvável neste fluxo)
        userId = usuarioDoc.id;
      }
      console.log('Usuário já existe no Firestore:', usuarioDoc.id);
    } else if (userId) {
      // Usuário não existe no Firestore, mas existe no Auth (ou foi acabado de criar)
      // Criar o documento no Firestore usando o UID do Auth como ID do documento
      const novoUsuario = {
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // authUid: userId // Opcional: redundante se o ID do doc é o UID
      };
      await adminDb.collection('usuarios').doc(userId).set(novoUsuario);
      console.log('Documento do usuário criado no Firestore:', userId);
    } else {
      // Caso muito improvável: não existe no Auth nem no Firestore e falhou ao criar no Auth
      throw new Error('Falha ao obter ou criar ID de usuário.');
    }

    // Retornar a resposta
    const message = userExistsInAuth && userExistsInFirestore
      ? 'Usuário admin já existe (Auth e Firestore).'
      : userExistsInAuth
      ? 'Usuário admin criado no Firestore.'
      : userExistsInFirestore
      ? 'Usuário admin criado no Auth.'
      : 'Usuário admin criado (Auth e Firestore).';

    return NextResponse.json({
      success: true,
      message,
      userId,
      email,
      nome,
    });

  } catch (error) {
    console.error('Erro ao verificar/criar usuário admin:', error);
    // Retorna um erro genérico no cliente para segurança
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao processar a solicitação.' },
      { status: 500 },
    );
  }
}
