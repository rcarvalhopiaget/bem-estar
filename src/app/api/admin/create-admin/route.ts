import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Rota para criar ou atualizar o usuário admin no Firestore
export async function GET() {
  try {
    const email = 'rodrigo.carvalho@jpiaget.com.br';
    const nome = 'Rodrigo Carvalho';
    const cargo = 'Administrador';
    const perfil = 'ADMIN';
    
    // Verificar se o banco de dados está disponível
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuário já existe, atualizar
      const usuarioDoc = querySnapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      await updateDoc(doc(db, 'usuarios', usuarioId), {
        nome,
        cargo,
        perfil,
        ativo: true,
        updatedAt: serverTimestamp()
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Usuário admin atualizado com sucesso',
        id: usuarioId,
        email,
        nome,
        cargo,
        perfil,
        ativo: true
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
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(usuariosRef, novoUsuario);
      
      return NextResponse.json({ 
        success: true,
        message: 'Usuário admin criado com sucesso',
        id: docRef.id,
        email,
        nome,
        cargo,
        perfil,
        ativo: true
      });
    }
    
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar/atualizar usuário admin', details: error }, 
      { status: 500 }
    );
  }
}
