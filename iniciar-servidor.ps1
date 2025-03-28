Write-Host "Preparando e iniciando o servidor BemEstar..." -ForegroundColor Cyan

# Parar quaisquer processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Processos Node.js encerrados." -ForegroundColor Yellow

# Definir variável de ambiente
$env:NODE_ENV = "production"
Write-Host "Ambiente definido como: PRODUCTION" -ForegroundColor Green

# Construir o projeto
Write-Host "Construindo o projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante a construção do projeto. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

# Iniciar o servidor
Write-Host "Iniciando o servidor..." -ForegroundColor Green
Write-Host "Acesse http://localhost:3000 para ver a aplicação." -ForegroundColor Cyan
npm run start 