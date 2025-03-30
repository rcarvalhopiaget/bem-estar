// Este arquivo é para uso em componentes de servidor
// Não importa bibliotecas client-side do Firebase diretamente

import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';

// Define o nome do cookie (deve ser o mesmo usado nos endpoints de API)
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

// Interface para tipagem do usuário autenticado
export interface AdminUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

// Função para verificar autenticação no servidor através do cookie de sessão
export async function getServerSession(): Promise<AdminUser | null> {
  try {
    // Obtendo o cookie de sessão
    const cookiesList = await cookies();
    const sessionCookie = cookiesList.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionCookie) {
      console.log('[getServerSession] Nenhum cookie de sessão encontrado.');
      return null;
    }
    
    // Inicializar o Firebase Admin
    const adminApp = initializeFirebaseAdmin();
    const auth = admin.auth(adminApp);
    
    // Verificar o cookie de sessão
    try {
      // O segundo parâmetro (true) verifica se o token foi revogado
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      
      // Opcionalmente, você pode obter mais informações do usuário
      const userRecord = await auth.getUser(decodedClaims.uid);
      
      // Verificar se o usuário é admin (você pode implementar sua própria lógica)
      // Exemplo: usando custom claims ou verificando em um banco de dados
      const isAdmin = userRecord.customClaims?.admin === true || 
                     ['admin@example.com', 'bemestar@jpiaget.com.br'].includes(userRecord.email || ''); // Mantenha/ajuste sua lógica de admin aqui
      
      console.log(`[getServerSession] Sessão verificada para usuário: ${userRecord.email} (${userRecord.uid})`);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email ?? null, // Garante que seja string | null
        emailVerified: userRecord.emailVerified,
        isAdmin: isAdmin
      };
    } catch (error: any) {
      if (error.code === 'auth/session-cookie-revoked' || error.code === 'auth/session-cookie-expired') {
        console.log('[getServerSession] Cookie de sessão expirado ou revogado.');
      } else {
        console.error('[getServerSession] Erro ao verificar cookie de sessão:', error);
      }
      // Importante: Limpar o cookie inválido no cliente seria ideal aqui, mas difícil em Server Component/Action.
      // O cliente deve lidar com o estado não autenticado.
      return null;
    }
  } catch (error: any) {
    console.error('[getServerSession] Erro ao processar autenticação:', error);
    return null;
  }
}

// Funções seguras para servidor que não dependem do client Firebase
export const serverAuth = {
  getUser: getServerSession,
  // Outras funções necessárias para o servidor
};
