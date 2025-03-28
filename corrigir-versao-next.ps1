# Script para corrigir problema de versão do Next.js
Write-Host "Corrigindo problema de versão do Next.js..."

# Parar quaisquer processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Processos Node.js encerrados."

# Remover a pasta .next atual (caso exista)
if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..."
    Remove-Item -Path ".next" -Recurse -Force
}

# Desinstalar versão atual do Next.js
Write-Host "Desinstalando versão atual do Next.js..."
npm uninstall next

# Instalar versão específica do Next.js que não tem o problema com undici
Write-Host "Instalando Next.js versão 13.4.12 (mais estável para este caso)..."
npm install next@13.4.12 react@18.2.0 react-dom@18.2.0

# Limpar o cache do npm
Write-Host "Limpando cache do npm..."
npm cache clean --force

# Reinstalar as dependências
Write-Host "Reinstalando dependências..."
npm install

# Construir o projeto
Write-Host "Construindo o projeto..."
$env:NODE_ENV = "production"
npm run build

Write-Host "Correção de versão concluída! Execute 'npm run start' para iniciar o servidor." 