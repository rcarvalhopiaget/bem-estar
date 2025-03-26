import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log para debug
console.log('Valores das variáveis de ambiente Firebase:', {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + '...',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

// Verifica se a configuração do Firebase está completa
const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  throw new Error(`Firebase configuration is incomplete. Missing fields: ${missingFields.join(', ')}`);
}

// Inicializa o Firebase
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase inicializado com sucesso');
  } else {
    app = getApps()[0];
    console.log('Usando instância existente do Firebase');
  }
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  throw error;
}

// Inicializa serviços
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Serviços Firebase inicializados:', {
  auth: !!auth,
  db: !!db,
});

export { app, auth, db };