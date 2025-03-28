# Script para limpar completamente os arquivos de cache e reconstruir a aplicação
Write-Host "Limpando completamente os arquivos de cache e reconstruindo a aplicação..." -ForegroundColor Cyan

# Garantir que não há processos npm rodando
try {
    $npmProcess = Get-Process npm -ErrorAction SilentlyContinue
    if ($npmProcess) {
        Write-Host "Encerrando processos npm anteriores..." -ForegroundColor Yellow
        $npmProcess | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
} catch {
    # Ignorar erros se não houver processos
}

# Limpar pastas de compilação e cache
if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
}

if (Test-Path -Path "node_modules/.cache") {
    Write-Host "Removendo cache do node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules/.cache
}

# Limpar problemas de case-sensitivity
Write-Host "Corrigindo problemas de case-sensitivity..." -ForegroundColor Yellow
if (Test-Path -Path "corrigir-toast.ps1") {
    & ./corrigir-toast.ps1
} else {
    Write-Host "Script corrigir-toast.ps1 não encontrado. Pulando esta etapa." -ForegroundColor Red
}

# Atualizar o next.config.js para remover opções deprecadas
Write-Host "Atualizando next.config.js..." -ForegroundColor Yellow
$nextConfig = Get-Content next.config.js
$updatedConfig = $nextConfig -replace "swcMinify: true,", ""
Set-Content -Path next.config.js -Value $updatedConfig

# Limpar cache do npm
Write-Host "Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force

# Reinstalar dependências
Write-Host "Reinstalando dependências..." -ForegroundColor Green
npm install --legacy-peer-deps

# Instalar dependências específicas que podem estar faltando
Write-Host "Instalando dependências específicas..." -ForegroundColor Green
npm install --save caniuse-lite@latest @mui/material firebase --legacy-peer-deps

# Construir a aplicação
Write-Host "Construindo a aplicação..." -ForegroundColor Green
npm run build

# Verificar se a build foi bem-sucedida
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao construir a aplicação!" -ForegroundColor Red
    exit 1
}

Write-Host "Build concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o servidor em modo de produção, execute:" -ForegroundColor Cyan
Write-Host "./iniciar-producao.ps1" -ForegroundColor White 