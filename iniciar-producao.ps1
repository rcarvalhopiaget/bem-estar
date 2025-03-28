# Script para iniciar o servidor em modo de produção
Write-Host "Iniciando o Sistema BemEstar em modo de PRODUÇÃO..." -ForegroundColor Cyan

# Verificar se o servidor está rodando na porta 3000
$portCheck = netstat -ano | findstr "LISTENING" | findstr ":3000"
if ($portCheck) {
    Write-Host "Porta 3000 já está em uso! Tentando encerrar o processo..." -ForegroundColor Yellow
    $processPID = ($portCheck -split ' ')[-1]
    try {
        Stop-Process -Id $processPID -Force
        Write-Host "Processo encerrado com sucesso (PID: $processPID)" -ForegroundColor Green
    } catch {
        Write-Host "Não foi possível encerrar o processo. Por favor, feche manualmente." -ForegroundColor Red
        Write-Host "Detalhes do processo: $portCheck" -ForegroundColor Red
        exit 1
    }
}

# Verificar se o arquivo .env existe
if (-not (Test-Path -Path ".env")) {
    Write-Host "Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro './setup-producao-win.ps1' para configurar o ambiente." -ForegroundColor Yellow
    exit 1
}

# Carregar variáveis de ambiente
Write-Host "Carregando variáveis de ambiente..." -ForegroundColor Yellow
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

# Verificar variáveis essenciais
$appUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_APP_URL")
$nextAuthUrl = [Environment]::GetEnvironmentVariable("NEXTAUTH_URL")

if ([string]::IsNullOrEmpty($appUrl) -or [string]::IsNullOrEmpty($nextAuthUrl)) {
    Write-Host "Configurações de URL incompletas! Por favor, verifique as variáveis NEXT_PUBLIC_APP_URL e NEXTAUTH_URL." -ForegroundColor Red
    exit 1
}

Write-Host "Configuração de URL: $appUrl" -ForegroundColor Green

# Verificar se a pasta .next existe (indicando que o projeto foi compilado)
if (-not (Test-Path -Path ".next")) {
    Write-Host "Pasta .next não encontrada! O projeto precisa ser compilado primeiro." -ForegroundColor Red
    Write-Host "Execute './setup-producao-win.ps1' para configurar e compilar o projeto." -ForegroundColor Yellow
    exit 1
}

# Iniciar o servidor em modo de produção
Write-Host "Iniciando servidor em modo de produção..." -ForegroundColor Green
Write-Host "O servidor estará disponível em: $appUrl" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para encerrar o servidor." -ForegroundColor Yellow
Write-Host ""

npm run start 