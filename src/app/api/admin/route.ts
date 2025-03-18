import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Rota para criar um usuário admin se não existir
export async function GET() {
  try {
    const email = 'rodrigo.carvalho@jpiaget.com.br';
    const senha = 'Senha@123'; // Senha temporária
    const nome = 'Rodrigo Carvalho';
    const cargo = 'Administrador';
    const perfil = 'ADMIN';
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuário já existe
      const usuario = querySnapshot.docs[0].data();
      return NextResponse.json({ 
        message: 'Usuário já existe', 
        usuario: {
          id: querySnapshot.docs[0].id,
          ...usuario
        }
      });
    }
    
    // Tentar fazer login primeiro para verificar se o usuário existe no Auth
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      console.log('Usuário já existe no Auth');
    } catch (error: any) {
      // Se o usuário não existe, criar no Auth
      if (error.code === 'auth/user-not-found') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        await updateProfile(userCredential.user, { displayName: nome });
        console.log('Usuário criado no Auth');
      } else {
        throw error;
      }
    }
    
    // Criar o documento do usuário no Firestore
    const novoUsuario = {
      email,
      nome,
      cargo,
      perfil,
      ativo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(usuariosRef, novoUsuario);
    
    return NextResponse.json({ 
      message: 'Usuário admin criado com sucesso', 
      usuario: {
        id: docRef.id,
        ...novoUsuario,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário admin', details: error }, 
      { status: 500 }
    );
  }
}
