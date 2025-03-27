import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Configuração do Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyBxjBGF_ZvUo9u_2MJrwVc2Og7uD5TDkQE",
  authDomain: "bem-estar-temp.firebaseapp.com",
  projectId: "bem-estar-temp",
  storageBucket: "bem-estar-temp.appspot.com",
  messagingSenderId: "654007389715",
  appId: "1:654007389715:web:d4af06004886e3d8b5d0c6"
};

// Verifica se a configuração do Firebase está completa
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is incomplete.');
}

// Inicializa o Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Exporta as instâncias do Firebase
export { app, auth, db, functions };
