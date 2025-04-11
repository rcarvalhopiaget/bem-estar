/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 * para facilitar buscas que ignoram acentos.
 * 
 * @param text Texto a ser normalizado
 * @returns Texto sem acentos e em minúsculas
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Converte para minúsculas e normaliza para decomposição Unicode
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove os acentos (marcas diacríticas)
}

/**
 * Verifica se uma string contém outra, ignorando acentos e case.
 * 
 * @param haystack Texto onde será buscado
 * @param needle Texto a ser encontrado
 * @returns true se encontrar, false caso contrário
 */
export function containsTextNormalized(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);
  
  return normalizedHaystack.includes(normalizedNeedle);
} 