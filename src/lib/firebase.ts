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
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Definido' : 'Não definido',
  authDomain: firebaseConfig.authDomain ? 'Definido' : 'Não definido',
  projectId: firebaseConfig.projectId ? 'Definido' : 'Não definido',
  storageBucket: firebaseConfig.storageBucket ? 'Definido' : 'Não definido',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Definido' : 'Não definido',
  appId: firebaseConfig.appId ? 'Definido' : 'Não definido',
});

// Verifica se a configuração do Firebase está completa
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Configuração do Firebase incompleta:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
  });
  throw new Error('Firebase configuration is incomplete.');
}

// Inicializa o Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta as instâncias do Firebase
export { app, auth, db };