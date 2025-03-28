// Este arquivo existe para compatibilidade com código existente
// e para garantir que o Firebase seja inicializado apenas uma vez.
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { app, auth, db, functions } from '@/config/firebase';

// Exportamos diretamente as instâncias já inicializadas para compatibilidade com código existente
export { app, auth, db, functions };

// Interface para o cliente Firebase
interface FirebaseClient {
  auth: Auth;
  firestore: Firestore;
  getInstance: () => FirebaseClient;
}

// Criamos objeto de cliente para manter compatibilidade com código antigo
export const firebaseClient: FirebaseClient = {
  auth: auth as Auth,
  firestore: db as Firestore,
  getInstance: () => firebaseClient
};

// Exportamos como padrão para compatibilidade com código existente
export default firebaseClient;
