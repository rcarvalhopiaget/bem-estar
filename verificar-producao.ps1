# Script para verificar a configuração de produção
Write-Host "Verificando a configuração de produção do Sistema BemEstar..." -ForegroundColor Cyan

# Carregar variáveis de ambiente
if (Test-Path -Path ".env") {
    Write-Host "Carregando variáveis de ambiente do arquivo .env..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -match '^"(.*)"$') {
                $value = $matches[1]
            }
            [Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
} else {
    Write-Host "Erro: Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# Função para verificar variável importante
function Check-EnvVariable {
    param (
        [string]$name,
        [bool]$sensitive = $false
    )

    $value = [Environment]::GetEnvironmentVariable($name)
    
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "  [ERRO] ${name}: Não definido" -ForegroundColor Red
        return $false
    } 
    else {
        if ($sensitive) {
            if ($value.Length -gt 10) {
                $maskedValue = $value.Substring(0, 3) + "***" + $value.Substring($value.Length - 3)
            } else {
                $maskedValue = "***"
            }
            Write-Host "  [OK] ${name}: $maskedValue" -ForegroundColor Green
        } else {
            Write-Host "  [OK] ${name}: $value" -ForegroundColor Green
        }
        return $true
    }
}

# Verificar grupo de variáveis
function Check-EnvGroup {
    param (
        [string]$title,
        [string[]]$variables,
        [bool]$sensitive = $false
    )

    Write-Host "${title}:" -ForegroundColor Cyan
    $allOk = $true
    
    foreach ($var in $variables) {
        $result = Check-EnvVariable -name $var -sensitive $sensitive
        $allOk = $allOk -and $result
    }
    
    Write-Host ""
    return $allOk
}

# Verificar grupos de variáveis
$firebaseOk = Check-EnvGroup -title "Configurações do Firebase" -variables @(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
) -sensitive $true

$appOk = Check-EnvGroup -title "Configurações da Aplicação" -variables @(
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_APP_NAME",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET"
) -sensitive $false

$emailOk = Check-EnvGroup -title "Configurações de Email" -variables @(
    "EMAIL_USER",
    "EMAIL_PASSWORD",
    "EMAIL_SMTP_HOST",
    "EMAIL_SMTP_PORT",
    "EMAIL_FROM"
) -sensitive $true

# Verificar se todas as verificações passaram
if ($firebaseOk -and $appOk -and $emailOk) {
    Write-Host "Todas as configurações de produção parecem corretas!" -ForegroundColor Green
    
    # Verificar se os URLs estão corretos
    if ($env:NEXT_PUBLIC_APP_URL -ne $env:NEXTAUTH_URL) {
        Write-Host "ATENÇÃO: NEXT_PUBLIC_APP_URL e NEXTAUTH_URL são diferentes! Eles devem ter o mesmo valor." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Configuração pronta para produção. Você pode iniciar o servidor com:" -ForegroundColor Cyan
    Write-Host "npm run start" -ForegroundColor White
} else {
    Write-Host "Existem problemas na configuração de produção. Corrija-os antes de iniciar o servidor." -ForegroundColor Red
} 