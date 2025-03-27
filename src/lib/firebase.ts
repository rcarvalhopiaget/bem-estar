import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebase';

console.log('Inicializando Firebase com config:', firebaseConfig);

// Inicializa o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

console.log('Firebase inicializado:', {
  app: !!app,
  auth: !!auth,
});

export { auth };