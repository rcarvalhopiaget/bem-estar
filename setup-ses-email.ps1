# Script para configurar o envio de emails via Amazon SES
# Este script configura as credenciais de email no arquivo .env

Write-Host "Configuração de Email Amazon SES - Sistema Bem-Estar" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado. Criando a partir do .env.example..." -ForegroundColor Yellow
    Copy-Item ".\.env.example" $envFile
}

# Ler o conteúdo atual do arquivo .env
$envContent = Get-Content $envFile -Raw

# Solicitar informações de email SES
Write-Host "Por favor, forneça as informações do Amazon SES:" -ForegroundColor Green
$emailUser = Read-Host "SMTP Username (credencial IAM)"
$emailPassword = Read-Host "SMTP Password (credencial IAM)" -AsSecureString
$emailHost = Read-Host "Host SMTP SES (ex: email-smtp.us-east-1.amazonaws.com)" 
if ([string]::IsNullOrWhiteSpace($emailHost)) { $emailHost = "email-smtp.us-east-1.amazonaws.com" }

$emailPort = Read-Host "Porta SMTP (padrão: 587)"
if ([string]::IsNullOrWhiteSpace($emailPort)) { $emailPort = "587" }

$emailFrom = Read-Host "Endereço de email verificado no SES"
$emailFromName = Read-Host "Nome de exibição (padrão: Sistema Bem-Estar)"
if ([string]::IsNullOrWhiteSpace($emailFromName)) { $emailFromName = "Sistema Bem-Estar" }

# Converter a senha segura para texto
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
$emailPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Preparar as variáveis de ambiente para email
$emailConfig = @"

# Configurações de Email
EMAIL_USER="$emailUser"
EMAIL_PASSWORD="$emailPasswordText"
EMAIL_SMTP_HOST="$emailHost"
EMAIL_SMTP_PORT="$emailPort"
EMAIL_FROM="$emailFromName <$emailFrom>"
EMAIL_TEST_MODE="false"
"@

# Verificar se as configurações de email já existem no arquivo
if ($envContent -match "# Configurações de Email") {
    # Substituir as configurações existentes
    $pattern = "# Configurações de Email[\s\S]*?(?=\r?\n\r?\n|\r?\n$|$)"
    $envContent = $envContent -replace $pattern, $emailConfig
} else {
    # Adicionar as configurações no final do arquivo
    $envContent += $emailConfig
}

# Salvar as alterações no arquivo .env
$envContent | Set-Content $envFile

Write-Host ""
Write-Host "Configurações de email SES atualizadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar o envio de email, execute:" -ForegroundColor Yellow
Write-Host "  .\test-email.ps1 -Email seu-email@exemplo.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Lembre-se de verificar se:" -ForegroundColor Red
Write-Host "  1. Sua conta SES está fora do sandbox (caso contrário, só poderá enviar para emails verificados)" -ForegroundColor Red
Write-Host "  2. O endereço de email remetente foi verificado no SES" -ForegroundColor Red
Write-Host "  3. As credenciais IAM têm permissão para enviar emails via SES" -ForegroundColor Red
