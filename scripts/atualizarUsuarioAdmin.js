const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD_aNuqZsRUXPqHMqZFLIwlnQCpnGP6XlE",
  authDomain: "bem-estar-c5637.firebaseapp.com",
  projectId: "bem-estar-c5637",
  storageBucket: "bem-estar-c5637.appspot.com",
  messagingSenderId: "1008631328452",
  appId: "1:1008631328452:web:0c2e9b3b5f5a3b9c4b9b9c"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para atualizar o usuário admin
async function atualizarUsuarioAdmin() {
  try {
    // Buscar o usuário pelo email
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', 'rodrigo.carvalho@jpiaget.com.br'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Usuário não encontrado. Verifique se o email está correto.');
      return;
    }
    
    // Atualizar o documento do usuário
    const usuarioDoc = querySnapshot.docs[0];
    const usuarioId = usuarioDoc.id;
    
    await updateDoc(doc(db, 'usuarios', usuarioId), {
      perfil: 'ADMIN',
      ativo: true,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Usuário ${usuarioId} atualizado com sucesso!`);
    console.log('Email: rodrigo.carvalho@jpiaget.com.br');
    console.log('Perfil: ADMIN');
    console.log('Status: Ativo');
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  }
}

// Executar a função
atualizarUsuarioAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
