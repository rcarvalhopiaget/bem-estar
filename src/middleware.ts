import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // DESATIVADO COMPLETAMENTE - Permite acesso sem autenticação a todas as rotas
  return NextResponse.next();
}

// Mantendo o matcher vazio para não fazer verificação em nenhuma rota
export const config = {
  matcher: [],
}; 