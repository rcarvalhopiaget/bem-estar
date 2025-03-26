# Script para configurar o envio de emails em produção
# Este script configura as credenciais de email no arquivo .env

Write-Host "Configuração de Email para Produção - Sistema Bem-Estar" -ForegroundColor Cyan
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

# Solicitar informações de email
Write-Host "Por favor, forneça as informações de email para produção:" -ForegroundColor Green
$emailUser = Read-Host "Email (ex: bemestar@jpiaget.com.br)"
$emailPassword = Read-Host "Senha do email ou senha de aplicativo" -AsSecureString
$emailHost = Read-Host "Host SMTP (padrão: smtp.gmail.com)" 
if ([string]::IsNullOrWhiteSpace($emailHost)) { $emailHost = "smtp.gmail.com" }

$emailPort = Read-Host "Porta SMTP (padrão: 587)"
if ([string]::IsNullOrWhiteSpace($emailPort)) { $emailPort = "587" }

$emailFrom = Read-Host "Nome de exibição (padrão: Sistema Bem-Estar)"
if ([string]::IsNullOrWhiteSpace($emailFrom)) { $emailFrom = "Sistema Bem-Estar" }

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
EMAIL_FROM="$emailFrom <$emailUser>"
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
Write-Host "Configurações de email atualizadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar o envio de email em produção, execute:" -ForegroundColor Yellow
Write-Host "  .\test-email.ps1 -Email $emailUser" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para testar o envio de relatório em produção, execute:" -ForegroundColor Yellow
Write-Host "  .\test-email.ps1 -Relatorio" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTA: Se você estiver usando o Gmail, certifique-se de:" -ForegroundColor Red
Write-Host "  1. Ativar a verificação em duas etapas na sua conta Google" -ForegroundColor Red
Write-Host "  2. Criar uma senha de aplicativo em: https://myaccount.google.com/apppasswords" -ForegroundColor Red
Write-Host "  3. Usar essa senha de aplicativo em vez da senha normal da conta" -ForegroundColor Red
