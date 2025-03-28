Write-Host "Corrigindo problemas de compatibilidade do Next.js..." -ForegroundColor Cyan

# Parar processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Processos Node.js encerrados." -ForegroundColor Yellow

# Remover pasta .next para limpar qualquer build anterior
if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force
}

# Remover node_modules
if (Test-Path -Path "node_modules") {
    Write-Host "Removendo node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force
}

# Verificar e remover instalações globais conflitantes
Write-Host "Verificando instalações globais conflitantes..." -ForegroundColor Yellow
$nextGlobal = npm list -g next 2>$null
if ($nextGlobal -match "next@") {
    Write-Host "Next.js instalado globalmente. Isso pode causar conflitos." -ForegroundColor Red
    Write-Host "Recomendamos usar apenas a versão local para evitar problemas." -ForegroundColor Yellow
}

# Instalar versões específicas e compatíveis
Write-Host "Instalando versões específicas e compatíveis..." -ForegroundColor Green
npm install --save next@12.3.4 react@17.0.2 react-dom@17.0.2

# Instalar outras dependências necessárias
Write-Host "Instalando dependências do Material UI..." -ForegroundColor Green
npm install --save @mui/material @mui/system @emotion/react@11.10.6 @emotion/styled@11.10.6

# Atualizar package.json manualmente
Write-Host "Atualizando scripts no package.json..." -ForegroundColor Yellow
try {
    $packageJson = Get-Content -Raw -Path "./package.json" | ConvertFrom-Json
    $packageJson.scripts.dev = "next dev"
    $packageJson.scripts.build = "next build"
    $packageJson.scripts.start = "next start"
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "./package.json"
    Write-Host "package.json atualizado com sucesso." -ForegroundColor Green
} catch {
    Write-Host "Erro ao atualizar package.json: $_" -ForegroundColor Red
}

# Construir o projeto
Write-Host "Construindo o projeto..." -ForegroundColor Cyan
npm run build

Write-Host "`nConcluído! Execute 'npm run dev' para iniciar o servidor em modo de desenvolvimento." -ForegroundColor Green
Write-Host "Ou execute 'npm run start' para iniciar em modo de produção." -ForegroundColor Green 