# Script para corrigir configurações duplicadas de email no arquivo .env
# Este script remove as configurações duplicadas e mantém apenas um conjunto

Write-Host "Corrigindo configurações de email no arquivo .env..." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# Ler o conteúdo atual do arquivo .env
$envContent = Get-Content $envFile -Raw

# Remover todas as configurações de email existentes
$pattern = "EMAIL_USER=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_PASSWORD=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_SMTP_HOST=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_SMTP_PORT=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_SMTP_SECURE=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_FROM=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

$pattern = "EMAIL_TEST_MODE=.*(\r?\n|$)"
$envContent = $envContent -replace $pattern, ""

# Remover linhas vazias consecutivas
$envContent = $envContent -replace "(\r?\n){2,}", "`n`n"

# Perguntar qual configuração deseja usar
Write-Host "Qual configuração de email você deseja usar?" -ForegroundColor Yellow
Write-Host "1. Gmail (smtp.gmail.com)" -ForegroundColor Green
Write-Host "2. Amazon SES (email-smtp.us-east-1.amazonaws.com)" -ForegroundColor Green
Write-Host "3. Configuração personalizada" -ForegroundColor Green
$choice = Read-Host "Escolha (1, 2 ou 3)"

# Configurar com base na escolha
switch ($choice) {
    "1" {
        # Gmail
        $emailUser = Read-Host "Email do Gmail (ex: bemestar@gmail.com)"
        $emailPassword = Read-Host "Senha de aplicativo do Gmail" -AsSecureString
        $emailFrom = Read-Host "Nome de exibição (ex: Sistema Bem-Estar)"
        
        # Converter a senha segura para texto
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
        $emailPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        $emailConfig = @"

# Configurações de Email (Gmail)
EMAIL_USER="$emailUser"
EMAIL_PASSWORD="$emailPasswordText"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_FROM="$emailFrom <$emailUser>"
EMAIL_TEST_MODE="false"
"@
        
        Write-Host ""
        Write-Host "IMPORTANTE: Para o Gmail, certifique-se de:" -ForegroundColor Yellow
        Write-Host "  1. Ativar a verificação em duas etapas na sua conta Google" -ForegroundColor Yellow
        Write-Host "  2. Criar uma senha de aplicativo em: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
        Write-Host "  3. Usar essa senha de aplicativo em vez da senha normal da conta" -ForegroundColor Yellow
    }
    "2" {
        # Amazon SES
        $emailUser = Read-Host "Chave de acesso da AWS (ex: AKIAXXXXXXXXXXXXXXXX)"
        $emailPassword = Read-Host "Chave secreta da AWS" -AsSecureString
        $emailFrom = Read-Host "Email verificado no SES (ex: bemestar@jpiaget.com.br)"
        $displayName = Read-Host "Nome de exibição (ex: Sistema Bem-Estar)"
        
        # Converter a senha segura para texto
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
        $emailPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        $emailConfig = @"

# Configurações de Email (Amazon SES)
EMAIL_USER="$emailUser"
EMAIL_PASSWORD="$emailPasswordText"
EMAIL_SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_SMTP_PORT="587"
EMAIL_FROM="$displayName <$emailFrom>"
EMAIL_TEST_MODE="false"
"@
        
        Write-Host ""
        Write-Host "IMPORTANTE: Para o Amazon SES, certifique-se de:" -ForegroundColor Yellow
        Write-Host "  1. Verificar o domínio ou email no console do SES" -ForegroundColor Yellow
        Write-Host "  2. Configurar as permissões corretas para o usuário IAM" -ForegroundColor Yellow
        Write-Host "  3. Se estiver em sandbox, verificar também os emails destinatários" -ForegroundColor Yellow
    }
    "3" {
        # Configuração personalizada
        $emailUser = Read-Host "Email ou nome de usuário"
        $emailPassword = Read-Host "Senha" -AsSecureString
        $emailHost = Read-Host "Host SMTP (ex: smtp.seudominio.com)"
        $emailPort = Read-Host "Porta SMTP (ex: 587)"
        $emailFrom = Read-Host "Email de origem"
        $displayName = Read-Host "Nome de exibição"
        
        # Converter a senha segura para texto
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
        $emailPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        $emailConfig = @"

# Configurações de Email (Personalizado)
EMAIL_USER="$emailUser"
EMAIL_PASSWORD="$emailPasswordText"
EMAIL_SMTP_HOST="$emailHost"
EMAIL_SMTP_PORT="$emailPort"
EMAIL_FROM="$displayName <$emailFrom>"
EMAIL_TEST_MODE="false"
"@
    }
    default {
        Write-Host "Opção inválida. Saindo sem fazer alterações." -ForegroundColor Red
        exit 1
    }
}

# Adicionar as novas configurações no final do arquivo
$envContent += $emailConfig

# Salvar as alterações no arquivo .env
$envContent | Set-Content $envFile

Write-Host ""
Write-Host "Configurações de email atualizadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar o envio de email, reinicie o servidor e execute:" -ForegroundColor Yellow
Write-Host "  .\test-email.ps1 -Email destinatario@exemplo.com" -ForegroundColor Yellow
