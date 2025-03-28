# Script para testar a aplicação em modo de produção
Write-Host "Iniciando teste de produção do Sistema BemEstar..." -ForegroundColor Cyan

function Check-Prerequisite {
    param (
        [string]$ItemName,
        [string]$ErrorMessage,
        [scriptblock]$TestScript
    )
    
    Write-Host "Verificando $ItemName..." -NoNewline
    
    if (& $TestScript) {
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    } else {
        Write-Host " [FALHA]" -ForegroundColor Red
        Write-Host "  $ErrorMessage" -ForegroundColor Yellow
        return $false
    }
}

# Verificar pré-requisitos
$allChecksPass = $true

# Verificar se a pasta .next existe
$allChecksPass = $allChecksPass -and (Check-Prerequisite -ItemName "Compilação de produção" `
    -ErrorMessage "A pasta .next não existe. Execute 'npm run build' primeiro." `
    -TestScript { Test-Path -Path ".next" })

# Verificar se o arquivo .env existe
$allChecksPass = $allChecksPass -and (Check-Prerequisite -ItemName "Arquivo .env" `
    -ErrorMessage "O arquivo .env não existe. Execute './setup-producao-win.ps1' primeiro." `
    -TestScript { Test-Path -Path ".env" })

# Verificar URL de produção
$allChecksPass = $allChecksPass -and (Check-Prerequisite -ItemName "URL de produção" `
    -ErrorMessage "URL de produção não configurada corretamente no .env" `
    -TestScript { 
        $envContent = Get-Content .env -ErrorAction SilentlyContinue
        $appUrl = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_APP_URL" }
        return $appUrl -ne $null 
    })

if (-not $allChecksPass) {
    Write-Host "Alguns pré-requisitos não foram atendidos. Corrigindo problemas..." -ForegroundColor Yellow
    
    # Verificar se a build foi feita
    if (-not (Test-Path -Path ".next")) {
        Write-Host "Compilando aplicação para produção..." -ForegroundColor Yellow
        npm run build
        
        if (-not (Test-Path -Path ".next")) {
            Write-Host "Falha na compilação! Tentando utilizar o script resolver-deps.ps1..." -ForegroundColor Red
            if (Test-Path -Path "resolver-deps.ps1") {
                Write-Host "Executando resolver-deps.ps1..." -ForegroundColor Yellow
                & ./resolver-deps.ps1
            } else {
                Write-Host "Script resolver-deps.ps1 não encontrado!" -ForegroundColor Red
                exit 1
            }
        }
    }
}

# Iniciar servidor em modo de produção
Write-Host "Iniciando servidor em modo de produção para teste..." -ForegroundColor Green
Write-Host "Depois que o servidor iniciar, acesse http://localhost:3000 e verifique:" -ForegroundColor Cyan
Write-Host "1. Se a página de login carrega corretamente" -ForegroundColor White
Write-Host "2. Se o login funciona (use credenciais de teste)" -ForegroundColor White  
Write-Host "3. Se o dashboard é exibido após o login" -ForegroundColor White
Write-Host "4. Se o menu de navegação funciona corretamente" -ForegroundColor White
Write-Host "5. Se os relatórios podem ser gerados" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para encerrar o servidor quando terminar os testes." -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run start 