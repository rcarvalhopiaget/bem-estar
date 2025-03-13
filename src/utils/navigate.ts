export async function navigateWithDelay(path: string, delayMs: number = 1000) {
  // Aguarda um momento para garantir que o estado de autenticação foi processado
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  // Força o redirecionamento usando window.location
  window.location.href = path;
}
