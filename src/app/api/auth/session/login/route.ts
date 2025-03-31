import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '@/lib/firebase/admin';

// Define o nome do cookie (pode vir de env var)
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const SESSION_COOKIE_DURATION_DAYS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token não fornecido.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * SESSION_COOKIE_DURATION_DAYS * 1000; // 5 dias em milissegundos
    const adminApp = initializeFirebaseAdmin();
    const auth = admin.auth(adminApp);

    // Verifica o ID token antes de criar o cookie de sessão
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken) {
        return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 401 });
    }

    console.log('[API Session Login] Token verificado com sucesso, criando cookie de sessão para:', decodedToken.uid);

    // Cria o cookie de sessão
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Define o cookie na resposta - criamos uma nova resposta com cookie
    const response = NextResponse.json(
      { success: true, message: 'Sessão iniciada.', redirectTo: '/dashboard' }, 
      { status: 200 }
    );
    
    // Configurar o cookie com opções adequadas para garantir que seja persistido
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge é em segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure apenas em HTTPS
      path: '/',
      sameSite: 'lax',
    });

    console.log('[API Session Login] Cookie de sessão criado com sucesso para:', decodedToken.uid);
    // Log adicional para verificar se o cookie foi configurado corretamente
    console.log('[API Session Login] Cookie configurado:',
      `nome=${SESSION_COOKIE_NAME}, expiração=${expiresIn/1000}s, httpOnly=true, secure=${process.env.NODE_ENV === 'production'}`);
    
    return response;

  } catch (error: any) {
    console.error('[API Session Login] Erro ao criar cookie de sessão:', error);
    // Verifica erros específicos do Firebase Auth
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ success: false, error: 'Token expirado.' }, { status: 401 });
    }
    if (error.code === 'auth/id-token-revoked') {
        return NextResponse.json({ success: false, error: 'Token revogado.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
} 