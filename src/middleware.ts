import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Verifica se a rota começa com /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('session');

    // Se não houver sessão, redireciona para o login
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
}; 