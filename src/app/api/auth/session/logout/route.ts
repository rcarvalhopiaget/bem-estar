import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';

// Define o nome do cookie (deve ser o mesmo usado no login)
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

export async function POST(request: NextRequest) {
  try {
    // Verificando cookie na requisição
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionCookie) {
      // Não há cookie, o usuário já está deslogado
      return NextResponse.json({ success: true, message: 'Nenhuma sessão ativa.' }, { status: 200 });
    }

    const adminApp = initializeFirebaseAdmin();
    const auth = admin.auth(adminApp);

    // Tenta verificar o cookie para obter o UID e então revogar os tokens
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie);
      await auth.revokeRefreshTokens(decodedClaims.sub); // sub é o UID
      console.log('[API Session Logout] Tokens revogados com sucesso para:', decodedClaims.sub);
    } catch (verifyError: any) {
      // Se a verificação falhar (expirado, inválido), o usuário já está efetivamente deslogado
      // Apenas registramos o erro, mas continuamos para limpar o cookie
      console.warn('[API Session Logout] Erro ao verificar/revogar token durante logout (pode ser normal se expirado):', verifyError.message);
    }

    // Criamos a resposta e removemos o cookie
    const response = NextResponse.json(
      { success: true, message: 'Sessão encerrada.' }, 
      { status: 200 }
    );
    
    // Remove o cookie da sessão
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      maxAge: 0, // Define como 0 para expirar imediatamente
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log('[API Session Logout] Cookie de sessão removido.');
    return response;

  } catch (error: any) {
    console.error('[API Session Logout] Erro inesperado durante logout:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
} 