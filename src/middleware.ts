import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Usa a mesma lógica da API para obter o nome do cookie
  const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

  // Verifica se a rota começa com /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Busca o cookie pelo nome correto
    const session = request.cookies.get(SESSION_COOKIE_NAME);

    // Para uma verificação rápida, verifique a existência de um cookie de sessão
    if (!session) {
      // Redirecionar para a página de login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Mantendo o matcher vazio para não fazer verificação em nenhuma rota
export const config = {
  matcher: '/dashboard/:path*',
}; 