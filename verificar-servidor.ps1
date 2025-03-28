Write-Host "Verificando o servidor BemEstar..." -ForegroundColor Cyan

# Verificar processos Node.js em execução
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✓ Processos Node.js encontrados:" -ForegroundColor Green
    $nodeProcesses | Format-Table Id, ProcessName, StartTime, CPU -AutoSize
} else {
    Write-Host "✗ Nenhum processo Node.js encontrado. O servidor pode estar desligado." -ForegroundColor Red
}

# Verificar portas em uso
Write-Host "`nVerificando portas em uso..." -ForegroundColor Cyan
$port3000 = netstat -ano | findstr ":3000"
if ($port3000) {
    Write-Host "✓ Porta 3000 está em uso:" -ForegroundColor Green
    Write-Host $port3000
} else {
    Write-Host "✗ Porta 3000 não está em uso. O servidor pode estar desligado." -ForegroundColor Red
}

# Testar conexão com o servidor
Write-Host "`nTestando conexão com o servidor..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Conexão bem-sucedida! Servidor respondendo na porta 3000." -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
} catch {
    Write-Host "✗ Não foi possível conectar ao servidor na porta 3000." -ForegroundColor Red
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Instruções para iniciar o servidor, se necessário
Write-Host "`n===== Se o servidor não estiver em execução =====" -ForegroundColor Yellow
Write-Host "Para iniciar o servidor em modo de desenvolvimento:"
Write-Host "  ./desenvolvimento.ps1" -ForegroundColor Gray

Write-Host "`nPara iniciar o servidor em modo de produção:"
Write-Host "  ./producao.ps1" -ForegroundColor Gray

Write-Host "`nPara acessar o aplicativo, visite:"
Write-Host "  http://localhost:3000" -ForegroundColor Cyan 