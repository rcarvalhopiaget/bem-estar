import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Configuração do Firebase LENDO VARIÁVEIS DE AMBIENTE
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verifica se todos os valores necessários foram carregados
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("Erro: Variáveis de ambiente do Firebase não estão configuradas corretamente.");
  // Você pode querer lançar um erro aqui ou lidar de outra forma
}

// Verifica se já existe uma instância do Firebase e usa ela, ou cria uma nova
let app;
if (getApps().length === 0) {
  console.log("Inicializando nova instância do Firebase com variáveis de ambiente."); // Log atualizado
  app = initializeApp(firebaseConfig);
} else {
  console.log("Usando instância existente do Firebase");
  app = getApps()[0];
}

// Inicializa os serviços
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Exporta as instâncias do Firebase
export { app, auth, db, functions };
