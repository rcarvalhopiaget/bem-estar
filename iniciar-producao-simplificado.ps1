# Script simples para ambiente de produção
Write-Host "Iniciando em modo de produção..."

# Definir ambiente
$env:NODE_ENV = "production"

# Construir
Write-Host "Construindo projeto..."
npm run build

# Iniciar
Write-Host "Iniciando servidor..."
npm run start 