// Implementação robusta do Firebase com inicialização de cliente segura

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxjBGF_ZvUo9u_2MJrwVc2Og7uD5TDkQE",
  authDomain: "bem-estar-temp.firebaseapp.com",
  projectId: "bem-estar-temp",
  storageBucket: "bem-estar-temp.appspot.com",
  messagingSenderId: "654007389715",
  appId: "1:654007389715:web:d4af06004886e3d8b5d0c6"
};

// Classes para garantir que o Firebase seja inicializado apenas uma vez
class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp | null = null;
  private _auth: Auth | null = null;
  private _firestore: Firestore | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        if (!getApps().length) {
          this.app = initializeApp(firebaseConfig);
          console.log('Firebase inicializado com sucesso (cliente)');
        } else {
          this.app = getApps()[0];
          console.log('Usando instância existente do Firebase (cliente)');
        }

        this._auth = getAuth(this.app);
        this._firestore = getFirestore(this.app);

        // Podemos adicionar emuladores se necessário para testes
        if (process.env.NODE_ENV === 'development') {
          // Descomentar para usar emuladores locais de teste
          // connectAuthEmulator(this._auth, 'http://localhost:9099');
        }
      } catch (error) {
        console.error('Erro ao inicializar Firebase (cliente):', error);
        throw error;
      }
    }
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  public get auth(): Auth {
    if (!this._auth) {
      throw new Error('Auth não foi inicializado - possível acesso do lado do servidor');
    }
    return this._auth;
  }

  public get firestore(): Firestore {
    if (!this._firestore) {
      throw new Error('Firestore não foi inicializado - possível acesso do lado do servidor');
    }
    return this._firestore;
  }
}

// Exportar as instâncias para uso no cliente
export const firebaseClient = FirebaseClient.getInstance();
export const auth = typeof window !== 'undefined' ? firebaseClient.auth : null;
export const db = typeof window !== 'undefined' ? firebaseClient.firestore : null;

// Exportar para compatibilidade com código existente
export default firebaseClient;
