// Script para atualizar o usuário do restaurante
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqmm0YNBM6b4mQnvHlU4EvEYbhQSgSC0M",
  authDomain: "bem-estar-c5637.firebaseapp.com",
  projectId: "bem-estar-c5637",
  storageBucket: "bem-estar-c5637.appspot.com",
  messagingSenderId: "1038245617029",
  appId: "1:1038245617029:web:4c3c7c5a0b3f2c3f2a5c5c"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function atualizarUsuarioRestaurante() {
  try {
    console.log('Buscando usuário do restaurante...');
    
    // Buscar o usuário pelo email
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', 'restaurante.piaget@jpiaget.com.br'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Atualizar o usuário existente
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, 'usuarios', docId);
      
      console.log(`Usuário encontrado com ID: ${docId}. Atualizando...`);
      
      await updateDoc(docRef, {
        nome: 'Taina Soares',
        perfil: 'OPERADOR',
        ativo: true,
        cargo: 'Operador de Restaurante',
        updatedAt: new Date()
      });
      
      console.log('Usuário atualizado com sucesso!');
    } else {
      // Criar um novo usuário
      console.log('Usuário não encontrado. Criando novo usuário...');
      
      const novoUsuarioRef = doc(collection(db, 'usuarios'));
      await setDoc(novoUsuarioRef, {
        nome: 'Taina Soares',
        email: 'restaurante.piaget@jpiaget.com.br',
        perfil: 'OPERADOR',
        ativo: true,
        cargo: 'Operador de Restaurante',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Novo usuário criado com ID: ${novoUsuarioRef.id}`);
    }
    
    console.log('Operação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  }
}

// Executar a função
atualizarUsuarioRestaurante();
