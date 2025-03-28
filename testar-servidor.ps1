# Script para testar se o servidor está em execução
$logFile = "teste-servidor.log"

# Função para registrar mensagens no log
function Write-Log {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    
    # Adicionar ao arquivo de log
    Add-Content -Path $logFile -Value $logMessage
    
    # Também mostrar no console com cores
    switch ($Type) {
        "INFO" { Write-Host $logMessage -ForegroundColor Cyan }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        default { Write-Host $logMessage }
    }
}

# Iniciar log
Write-Log "Iniciando teste do servidor BemEstar"

# Verificar processos Node.js em execução
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        $processCount = $nodeProcesses.Count
        Write-Log "$processCount processo(s) Node.js encontrado(s)" "SUCCESS"
        
        foreach ($process in $nodeProcesses) {
            $runtime = (Get-Date) - $process.StartTime
            $runtimeFormatted = "{0:D2}h:{1:D2}m:{2:D2}s" -f $runtime.Hours, $runtime.Minutes, $runtime.Seconds
            
            Write-Log "Processo ID: $($process.Id), Tempo em execução: $runtimeFormatted" "INFO"
        }
    } else {
        Write-Log "Nenhum processo Node.js encontrado. O servidor pode não estar em execução." "WARNING"
    }
} catch {
    Write-Log "Erro ao verificar processos: $_" "ERROR"
}

# Verificar portas em uso
try {
    Write-Log "Verificando se a porta 3000 está em uso..."
    
    $portInUse = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
    
    if ($portInUse) {
        $matchesParts = $portInUse -split '\s+'
        if ($matchesParts.Count -ge 5) {
            $processId = $matchesParts[$matchesParts.Count - 1]
            Write-Log "Porta 3000 está em uso pelo processo com ID: $processId" "SUCCESS"
            
            try {
                $processInfo = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($processInfo) {
                    Write-Log "Nome do processo: $($processInfo.ProcessName)" "INFO"
                }
            } catch {
                Write-Log "Não foi possível obter informações sobre o processo: $_" "WARNING"
            }
        } else {
            Write-Log "Porta 3000 está em uso, mas não foi possível identificar o processo" "WARNING"
        }
    } else {
        Write-Log "Porta 3000 não está em uso. O servidor pode não estar em execução." "WARNING"
    }
} catch {
    Write-Log "Erro ao verificar portas: $_" "ERROR"
}

# Verificar ambiente
Write-Log "Verificando variáveis de ambiente..."
if ($env:NODE_ENV -eq "production") {
    Write-Log "NODE_ENV está configurado como 'production'" "SUCCESS"
} else {
    Write-Log "NODE_ENV não está configurado como 'production'. Valor atual: $($env:NODE_ENV)" "WARNING"
}

# Verificar pasta .next
if (Test-Path -Path ".next") {
    Write-Log "Pasta .next existe, indicando que o build foi realizado" "SUCCESS"
} else {
    Write-Log "Pasta .next não encontrada. O projeto pode não ter sido compilado." "WARNING"
}

# Verificar .env.production
if (Test-Path -Path ".env.production") {
    Write-Log "Arquivo .env.production existe" "SUCCESS"
} else {
    Write-Log "Arquivo .env.production não encontrado" "WARNING"
}

# Verificar acesso ao servidor (tentativa básica)
try {
    Write-Log "Tentando acessar o servidor na URL http://localhost:3000..."
    
    # Usar timeout curto para não travar o script
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    if ($response -and $response.StatusCode -eq 200) {
        Write-Log "Servidor respondeu com sucesso (StatusCode: $($response.StatusCode))" "SUCCESS"
    } else {
        Write-Log "Servidor respondeu, mas com status inesperado: $($response.StatusCode)" "WARNING"
    }
} catch {
    Write-Log "Não foi possível conectar ao servidor: $_" "ERROR"
}

Write-Log "Teste concluído. Verifique o arquivo $logFile para mais detalhes." 