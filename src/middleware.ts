import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Usa a mesma lógica da API para obter o nome do cookie
  const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

  // URL atual
  const { pathname } = request.nextUrl;
  
  // Obtém o cookie de sessão
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  // Log para debug
  console.log(`[Middleware] Verificando acesso para: ${pathname}, Autenticado: ${isAuthenticated}`);

  // Rotas protegidas que exigem autenticação
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log(`[Middleware] Acesso negado a ${pathname}, redirecionando para /login`);
      // Redirecionar para a página de login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log(`[Middleware] Acesso permitido a ${pathname}`);
  }

  // Rotas de autenticação (redirecionar para dashboard se já estiver autenticado)
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    console.log(`[Middleware] Usuário já autenticado em ${pathname}, redirecionando para /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirecionamento da raiz para o dashboard se autenticado, ou para login se não
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log(`[Middleware] Redirecionando raiz para /dashboard (autenticado)`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log(`[Middleware] Redirecionando raiz para /login (não autenticado)`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Aplicar o middleware a todas as rotas
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}; 