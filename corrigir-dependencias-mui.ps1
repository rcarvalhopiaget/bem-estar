Write-Host "Corrigindo dependências do Material UI..." -ForegroundColor Cyan

# Parar quaisquer processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Processos Node.js encerrados." -ForegroundColor Yellow

# Remover pasta .next
if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force
}

# Instalar as dependências do MUI necessárias
Write-Host "Instalando dependências do Material UI..." -ForegroundColor Green
npm install @mui/system @mui/material @emotion/react @emotion/styled --save

# Forçar a instalação correta do pacote de cor do MUI
Write-Host "Instalando @mui/system/colorManipulator..." -ForegroundColor Green
npm install @mui/system@latest --save

# Verificar node_modules
if (-not (Test-Path -Path "node_modules/@mui/system")) {
    Write-Host "Pasta @mui/system não encontrada, instalando de forma manual..." -ForegroundColor Yellow
    npm install @mui/system@latest --save
}

# Definir versões compatíveis de React e ReactDOM
Write-Host "Instalando versões compatíveis de React e ReactDOM..." -ForegroundColor Green
npm install react@18.2.0 react-dom@18.2.0 --save

# Instruções para compilar
Write-Host "`nDependências corrigidas!" -ForegroundColor Cyan
Write-Host "Execute os seguintes comandos para construir e iniciar o projeto:" -ForegroundColor Yellow
Write-Host "1. `$env:NODE_ENV='production'" -ForegroundColor White
Write-Host "2. npm run build" -ForegroundColor White
Write-Host "3. npm run start" -ForegroundColor White 