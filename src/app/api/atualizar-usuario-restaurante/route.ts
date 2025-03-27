import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando atualização do usuário do restaurante...');
    
    // Obter dados do corpo da requisição
    const userData = await request.json();
    const email = userData.email || 'restaurante.piaget@jpiaget.com.br';
    
    console.log('Dados recebidos:', userData);
    
    // Verificar se o banco de dados está disponível
    if (!db) {
      console.error('Banco de dados não disponível');
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar usuário',
        error: 'Banco de dados não disponível'
      }, { status: 500 });
    }
    
    // Buscar o usuário pelo email
    const usuariosRef = collection(db, 'usuarios');
    console.log('Buscando usuário com email:', email);
    
    try {
      // Verificar todos os usuários
      const todosUsuarios = await getDocs(usuariosRef);
      console.log('Total de usuários encontrados:', todosUsuarios.size);
      todosUsuarios.forEach((userDoc) => {
        console.log('Usuário:', userDoc.id, userDoc.data());
      });
    } catch (error) {
      console.log('Erro ao listar todos os usuários:', error);
    }
    
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    console.log('Resultado da busca:', querySnapshot.size, 'documentos encontrados');
    
    if (!querySnapshot.empty) {
      // Atualizar o usuário existente
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, 'usuarios', docId);
      
      console.log(`Usuário encontrado com ID: ${docId}. Dados atuais:`, querySnapshot.docs[0].data());
      console.log('Atualizando...');
      
      const updateData = {
        nome: userData.nome || 'Taina Soares',
        perfil: userData.perfil || 'OPERADOR',
        ativo: userData.ativo !== undefined ? userData.ativo : true,
        cargo: userData.cargo || 'Operador de Restaurante',
        updatedAt: new Date()
      };
      
      console.log('Dados para atualização:', updateData);
      
      await updateDoc(docRef, updateData);
      
      // Verificar se a atualização foi bem-sucedida
      const docAtualizado = await getDoc(docRef);
      console.log('Usuário após atualização:', docAtualizado.data());
      
      console.log('Usuário atualizado com sucesso!');
      
      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        id: docId,
        data: docAtualizado.data()
      });
    } else {
      // Criar um novo usuário
      console.log('Usuário não encontrado. Criando novo usuário...');
      
      const novoUsuarioRef = doc(collection(db, 'usuarios'));
      const newUserData = {
        nome: userData.nome || 'Taina Soares',
        email: email,
        perfil: userData.perfil || 'OPERADOR',
        ativo: userData.ativo !== undefined ? userData.ativo : true,
        cargo: userData.cargo || 'Operador de Restaurante',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Dados do novo usuário:', newUserData);
      
      await setDoc(novoUsuarioRef, newUserData);
      
      // Verificar se a criação foi bem-sucedida
      const docCriado = await getDoc(novoUsuarioRef);
      console.log('Novo usuário após criação:', docCriado.data());
      
      console.log(`Novo usuário criado com ID: ${novoUsuarioRef.id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Novo usuário criado com sucesso',
        id: novoUsuarioRef.id,
        data: docCriado.data()
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
