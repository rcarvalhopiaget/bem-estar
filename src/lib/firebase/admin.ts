import * as admin from 'firebase-admin'

interface FirebaseAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  // Substitui \n por quebras de linha reais na chave privada
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Variáveis de ambiente Firebase Admin (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) não estão configuradas.',
    )
  }

  return { projectId, clientEmail, privateKey }
}

export function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app() // Retorna a instância já inicializada
  }

  try {
    const { projectId, clientEmail, privateKey } = getFirebaseAdminConfig()

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      // Adicione databaseURL se estiver usando Realtime Database
      // databaseURL: `https://${projectId}.firebaseio.com`,
    })
    console.log('Firebase Admin SDK inicializado com sucesso.')
    return admin.app()
  } catch (error: any) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error)
    // Lança um erro mais genérico para evitar expor detalhes da chave
    throw new Error('Falha ao inicializar a configuração do servidor Firebase.')
  }
}

// Inicializa imediatamente para garantir que esteja pronto quando necessário
// initializeFirebaseAdmin()

// Exporta instâncias pré-inicializadas para conveniência
// export const adminAuth = admin.auth()
// export const adminDb = admin.firestore()
// export const adminStorage = admin.storage()
// Nota: Obter instâncias como admin.firestore() após a inicialização é mais seguro
// para garantir que a app padrão foi inicializada primeiro. 