# Script para configurar o ambiente de produção
Write-Host "Configurando o ambiente de produção para o sistema BemEstar..."

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

# Instalar dependências
Write-Host "Instalando dependências..." -ForegroundColor Green
npm install

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