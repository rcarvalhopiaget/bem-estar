# Script para verificar as configurações de email atuais
# Este script mostra as configurações de email no arquivo .env sem mostrar a senha

Write-Host "Verificação de Configurações de Email - Sistema Bem-Estar" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado." -ForegroundColor Red
    exit 1
}

# Ler o conteúdo atual do arquivo .env
$envContent = Get-Content $envFile

# Extrair e mostrar as configurações de email
$emailUser = ($envContent | Where-Object { $_ -match "EMAIL_USER=" }) -replace 'EMAIL_USER="(.+)"', '$1'
$emailHost = ($envContent | Where-Object { $_ -match "EMAIL_SMTP_HOST=" }) -replace 'EMAIL_SMTP_HOST="(.+)"', '$1'
$emailPort = ($envContent | Where-Object { $_ -match "EMAIL_SMTP_PORT=" }) -replace 'EMAIL_SMTP_PORT="(.+)"', '$1'
$emailFrom = ($envContent | Where-Object { $_ -match "EMAIL_FROM=" }) -replace 'EMAIL_FROM="(.+)"', '$1'
$emailTestMode = ($envContent | Where-Object { $_ -match "EMAIL_TEST_MODE=" }) -replace 'EMAIL_TEST_MODE="(.+)"', '$1'

Write-Host "Configurações de Email Atuais:" -ForegroundColor Green
Write-Host "  Email: $emailUser"
Write-Host "  Host SMTP: $emailHost"
Write-Host "  Porta SMTP: $emailPort"
Write-Host "  De: $emailFrom"
Write-Host "  Modo de Teste: $emailTestMode"
Write-Host ""

# Verificar se estamos usando Amazon SES
if ($emailHost -match "amazonaws.com") {
    Write-Host "Você está usando Amazon SES como servidor SMTP." -ForegroundColor Yellow
    Write-Host "Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "  1. Sua conta SES está fora do sandbox (caso contrário, só poderá enviar para emails verificados)" -ForegroundColor Yellow
    Write-Host "  2. As credenciais IAM têm permissão para enviar emails via SES" -ForegroundColor Yellow
    Write-Host "  3. O endereço de email remetente foi verificado no SES" -ForegroundColor Yellow
}

# Verificar se estamos usando Gmail
if ($emailHost -match "gmail.com") {
    Write-Host "Você está usando Gmail como servidor SMTP." -ForegroundColor Yellow
    Write-Host "Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "  1. A verificação em duas etapas está ativada na conta Google" -ForegroundColor Yellow
    Write-Host "  2. Você está usando uma senha de aplicativo (não a senha normal da conta)" -ForegroundColor Yellow
    Write-Host "  3. O acesso a apps menos seguros está ativado (se não estiver usando senha de aplicativo)" -ForegroundColor Yellow
}

Write-Host "Para testar o envio de email, execute:" -ForegroundColor Magenta
Write-Host "  .\test-email.ps1 -Email seu-email@exemplo.com" -ForegroundColor Magenta
