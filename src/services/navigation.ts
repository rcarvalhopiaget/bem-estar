import { User } from 'firebase/auth';

export async function safeNavigate(path: string, user?: User | null): Promise<void> {
  // Aguarda um momento para garantir que o estado de autenticação está sincronizado
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verifica se o usuário está autenticado para rotas protegidas
  if (path.startsWith('/dashboard')) {
    if (!user) {
      window.location.href = '/login';
      return;
    }
  }

  // Verifica se o usuário está tentando acessar páginas de auth quando já está logado
  if ((path === '/login' || path === '/register') && user) {
    window.location.href = '/dashboard';
    return;
  }

  // Realiza a navegação
  window.location.href = path;
}
