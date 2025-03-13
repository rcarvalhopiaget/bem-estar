'use client';

export async function handleAuthRedirect(path: string = '/dashboard') {
  // Aguarda um momento para garantir que o token foi processado
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Força o redirecionamento usando window.location
  window.location.href = path;
}
