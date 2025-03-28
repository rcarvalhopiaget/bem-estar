# Script para configurar o ambiente de produção no Windows
Write-Host "Configurando o ambiente de produção para o sistema BemEstar..." -ForegroundColor Cyan

# Verificar se o arquivo .env.production existe
if (-not (Test-Path -Path ".env.production")) {
    Write-Host "Erro: Arquivo .env.production não encontrado!" -ForegroundColor Red
    exit 1
}

# Fazer backup do arquivo .env atual
if (Test-Path -Path ".env") {
    Write-Host "Fazendo backup do arquivo .env..." -ForegroundColor Yellow
    Copy-Item -Path ".env" -Destination ".env.backup"
}

# Copiar o arquivo .env.production para .env
Write-Host "Aplicando configurações de produção..." -ForegroundColor Green
Copy-Item -Path ".env.production" -Destination ".env" -Force

# Limpar completamente os arquivos de compilação para evitar problemas de cache
if (Test-Path -Path ".next") {
    Write-Host "Limpando pasta .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
}

# Limpar o cache do npm para garantir dependências atualizadas
Write-Host "Limpando cache npm..." -ForegroundColor Yellow
npm cache clean --force

# Instalar dependências limpas
Write-Host "Instalando dependências..." -ForegroundColor Green
npm ci

# Verificar se existem problemas de case-sensitivity em arquivos-chave
Write-Host "Verificando problemas de case-sensitivity em arquivos..." -ForegroundColor Yellow

$toastFiles = Get-ChildItem -Path "src/components/ui" -Filter "toast*.tsx" -Recurse
if ($toastFiles.Count -gt 0) {
    Write-Host "Encontrados arquivos toast:" -ForegroundColor Yellow
    foreach ($file in $toastFiles) {
        Write-Host "  $($file.FullName)" -ForegroundColor Yellow
    }
    
    # Se existir um Toast.tsx e um toast.tsx, mantemos apenas o toast.tsx
    if ((Test-Path -Path "src/components/ui/Toast.tsx") -and (Test-Path -Path "src/components/ui/toast.tsx")) {
        Write-Host "Detectada duplicidade de arquivos (Toast.tsx e toast.tsx). Mantendo apenas toast.tsx..." -ForegroundColor Red
        Remove-Item -Path "src/components/ui/Toast.tsx" -Force
    }
    
    # Se existir apenas Toast.tsx, renomeá-lo para toast.tsx
    if ((Test-Path -Path "src/components/ui/Toast.tsx") -and (-not (Test-Path -Path "src/components/ui/toast.tsx"))) {
        Write-Host "Renomeando Toast.tsx para toast.tsx para garantir consistência..." -ForegroundColor Yellow
        Rename-Item -Path "src/components/ui/Toast.tsx" -NewName "toast.tsx"
    }
}

# Construir a aplicação
Write-Host "Construindo a aplicação para produção..." -ForegroundColor Green
npm run build

# Verificar se a build foi bem-sucedida
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao construir a aplicação!" -ForegroundColor Red
    
    # Restaurar o backup do arquivo .env
    if (Test-Path -Path ".env.backup") {
        Write-Host "Restaurando arquivo .env original..." -ForegroundColor Yellow
        Copy-Item -Path ".env.backup" -Destination ".env" -Force
    }
    
    exit 1
}

Write-Host "Build de produção concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o servidor em modo de produção, execute:" -ForegroundColor Cyan
Write-Host "npm run start" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Certifique-se de que o URL de produção está configurado corretamente no arquivo .env" -ForegroundColor Yellow
Write-Host "URL atual: $env:NEXT_PUBLIC_APP_URL" -ForegroundColor Yellow 