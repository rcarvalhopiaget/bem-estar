import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa o Firebase Admin SDK se ainda não estiver inicializado
const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\n'),
      }),
    })
  : getApps()[0];

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
