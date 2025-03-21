# Script para configurar as variáveis de ambiente para o envio de email

# Solicitar informações do usuário
$emailUser = Read-Host -Prompt "Digite o email que será usado para enviar mensagens (ex: seu-email@gmail.com)"
$emailPassword = Read-Host -Prompt "Digite a senha do email ou a senha de aplicativo (para Gmail com 2FA)" -AsSecureString
$emailSmtpHost = Read-Host -Prompt "Digite o host SMTP (padrão: smtp.gmail.com)" 
$emailSmtpPort = Read-Host -Prompt "Digite a porta SMTP (padrão: 587)"
$emailSmtpSecure = Read-Host -Prompt "O servidor SMTP usa conexão segura? (true/false, padrão: false)"
$emailFrom = Read-Host -Prompt "Digite o nome e email do remetente (ex: 'Sistema Bem-Estar <bemestar@jpiaget.com.br>')"
$emailTestMode = Read-Host -Prompt "Ativar modo de teste? (true/false, padrão: false)"

# Usar valores padrão se não fornecidos
if ([string]::IsNullOrEmpty($emailSmtpHost)) { $emailSmtpHost = "smtp.gmail.com" }
if ([string]::IsNullOrEmpty($emailSmtpPort)) { $emailSmtpPort = "587" }
if ([string]::IsNullOrEmpty($emailSmtpSecure)) { $emailSmtpSecure = "false" }
if ([string]::IsNullOrEmpty($emailFrom)) { $emailFrom = "Sistema Bem-Estar <bemestar@jpiaget.com.br>" }
if ([string]::IsNullOrEmpty($emailTestMode)) { $emailTestMode = "false" }

# Converter a senha segura para texto
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
$emailPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Verificar se o arquivo .env existe
$envFile = ".\.env"
if (Test-Path $envFile) {
    # Ler o conteúdo atual
    $envContent = Get-Content $envFile -Raw
} else {
    # Criar um novo arquivo
    $envContent = ""
}

# Adicionar ou atualizar as variáveis de ambiente
$envVars = @(
    "EMAIL_USER=$emailUser",
    "EMAIL_PASSWORD=$emailPasswordText",
    "EMAIL_SMTP_HOST=$emailSmtpHost",
    "EMAIL_SMTP_PORT=$emailSmtpPort",
    "EMAIL_SMTP_SECURE=$emailSmtpSecure",
    "EMAIL_FROM=$emailFrom",
    "EMAIL_TEST_MODE=$emailTestMode"
)

# Verificar se cada variável já existe no arquivo e atualizá-la ou adicioná-la
foreach ($var in $envVars) {
    $varName = $var.Split('=')[0]
    if ($envContent -match "$varName=") {
        $envContent = $envContent -replace "$varName=.*", $var
    } else {
        $envContent += "`n$var"
    }
}

# Salvar o arquivo .env
$envContent | Out-File $envFile -Encoding utf8

Write-Host "`nConfigurações de email atualizadas com sucesso no arquivo .env"
Write-Host "Reinicie o servidor Next.js para aplicar as alterações"
