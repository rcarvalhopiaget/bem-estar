import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Função para tratar a chave privada corretamente
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) {
    console.error('ERRO: Chave privada não definida');
    return undefined;
  }
  
  // Se a chave já contém "\n", não precisamos substituir
  if (key.includes('\n')) {
    return key;
  }
  
  // Substitui \\n por \n
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  
  // Tenta remover aspas extras que podem estar presentes
  if (key.startsWith('"') && key.endsWith('"')) {
    return key.slice(1, -1).replace(/\\n/g, '\n');
  }
  
  return key;
}

// Log para depuração (sem mostrar a chave completa por segurança)
console.log('Firebase Admin Config:', {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
  privateKeyDefined: !!(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
});

// Inicializa o Firebase Admin SDK se ainda não estiver inicializado
const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
      }),
    })
  : getApps()[0];

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
