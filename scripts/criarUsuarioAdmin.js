const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo de credenciais
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Arquivo de credenciais não encontrado em:', serviceAccountPath);
  console.log('Por favor, baixe o arquivo serviceAccountKey.json do console do Firebase e coloque-o na raiz do projeto.');
  process.exit(1);
}

// Inicializar o Firebase Admin
const serviceAccount = require(serviceAccountPath);
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);
const auth = getAuth(app);

// Função para criar ou atualizar o usuário admin
async function criarOuAtualizarUsuarioAdmin() {
  const email = 'rodrigo.carvalho@jpiaget.com.br';
  const nome = 'Rodrigo Carvalho';
  const cargo = 'Administrador';
  const perfil = 'ADMIN';
  
  try {
    // Verificar se o usuário já existe no Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('Usuário já existe no Auth:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Criar o usuário no Auth
        userRecord = await auth.createUser({
          email: email,
          displayName: nome,
          password: 'Senha@123', // Senha temporária
          emailVerified: true
        });
        console.log('Usuário criado no Auth:', userRecord.uid);
      } else {
        throw error;
      }
    }
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      // Criar o documento do usuário no Firestore
      const novoUsuario = {
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      const docRef = await usuariosRef.add(novoUsuario);
      console.log('Usuário criado no Firestore com ID:', docRef.id);
    } else {
      // Atualizar o documento do usuário
      const docRef = snapshot.docs[0].ref;
      await docRef.update({
        nome,
        cargo,
        perfil,
        ativo: true,
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log('Usuário atualizado no Firestore com ID:', docRef.id);
    }
    
    console.log('Operação concluída com sucesso!');
    console.log('Email:', email);
    console.log('Nome:', nome);
    console.log('Cargo:', cargo);
    console.log('Perfil:', perfil);
    console.log('Status: Ativo');
    
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error);
  }
}

// Executar a função
criarOuAtualizarUsuarioAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
