# Script para testar o envio de emails no sistema Bem-Estar
# Este script permite testar diferentes configurações de email

param (
    [Parameter(Mandatory=$false)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [switch]$Relatorio,
    
    [Parameter(Mandatory=$false)]
    [switch]$Simulacao,
    
    [Parameter(Mandatory=$false)]
    [string]$Data
)

$baseUrl = "http://localhost:3000"

# Função para exibir ajuda
function Show-Help {
    Write-Host "Uso: .\test-email.ps1 [-Email email@exemplo.com] [-Relatorio] [-Simulacao] [-Data yyyy-MM-dd]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "  -Email      : Endereço de email para enviar o teste (opcional)"
    Write-Host "  -Relatorio  : Envia um relatório diário em vez de um email de teste"
    Write-Host "  -Simulacao  : Força o modo de simulação, mesmo em produção"
    Write-Host "  -Data       : Data específica para o relatório (formato: yyyy-MM-dd)"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Green
    Write-Host "  .\test-email.ps1                           # Envia um email de teste para o email configurado"
    Write-Host "  .\test-email.ps1 -Email user@example.com   # Envia um email de teste para o email especificado"
    Write-Host "  .\test-email.ps1 -Relatorio                # Envia um relatório diário para o email configurado"
    Write-Host "  .\test-email.ps1 -Relatorio -Data 2025-03-24  # Envia um relatório para uma data específica"
    Write-Host ""
}

# Se não houver parâmetros, mostrar ajuda
if ($PSBoundParameters.Count -eq 0 -and $args.Count -eq 0) {
    Show-Help
    exit 0
}

# Construir a URL com base nos parâmetros
$url = ""
if ($Relatorio) {
    $url = "$baseUrl/api/agendar-relatorio"
    
    # Adicionar parâmetros à URL
    $params = @()
    
    if ($Data) {
        $params += "data=$Data"
    }
    
    if ($Simulacao) {
        $params += "simulacao=true"
    }
    
    if ($params.Count -gt 0) {
        $url += "?" + ($params -join "&")
    }
    
    Write-Host "Enviando relatório diário..." -ForegroundColor Yellow
} else {
    $url = "$baseUrl/api/enviar-teste"
    
    # Adicionar parâmetros à URL
    $params = @()
    
    if ($Email) {
        $params += "email=$Email"
    }
    
    if ($Simulacao) {
        $params += "simulacao=true"
    }
    
    if ($params.Count -gt 0) {
        $url += "?" + ($params -join "&")
    }
    
    Write-Host "Enviando email de teste..." -ForegroundColor Yellow
}

Write-Host "URL: $url" -ForegroundColor Gray

try {
    # Fazer a requisição
    $response = Invoke-RestMethod -Uri $url -Method Get

    # Exibir resposta
    Write-Host "Resposta:" -ForegroundColor Green
    Write-Host "  Sucesso: $($response.success)" -ForegroundColor Green
    Write-Host "  Mensagem: $($response.message)" -ForegroundColor Green
    
    # Se for um email de teste e tiver URL de preview
    if (-not $Relatorio -and $response.previewUrl) {
        Write-Host "  Preview URL: $($response.previewUrl)" -ForegroundColor Cyan
        
        # Perguntar se deseja abrir o preview no navegador
        $openBrowser = Read-Host "Deseja abrir o preview no navegador? (S/N)"
        if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
            Start-Process $response.previewUrl
        }
    }
    
    # Se for um relatório, mostrar dados adicionais
    if ($Relatorio -and $response.data) {
        Write-Host "  Data do relatório: $($response.data.dataRelatorio)" -ForegroundColor Green
        Write-Host "  Total de alunos: $($response.data.totalAlunos)" -ForegroundColor Green
        Write-Host "  Alunos que comeram: $($response.data.totalComeram)" -ForegroundColor Green
        Write-Host "  Alunos que não comeram: $($response.data.totalNaoComeram)" -ForegroundColor Green
        
        if ($response.data.simulado) {
            Write-Host "  [SIMULAÇÃO] Este relatório foi gerado com dados simulados" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Erro ao enviar email:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Tentar obter mais detalhes do erro
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Detalhes do erro:" -ForegroundColor Red
        Write-Host "  Mensagem: $($errorDetails.message)" -ForegroundColor Red
        if ($errorDetails.error) {
            Write-Host "  Erro: $($errorDetails.error)" -ForegroundColor Red
        }
    } catch {
        # Se não conseguir converter para JSON, mostrar a mensagem de erro completa
        Write-Host "Resposta completa:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
