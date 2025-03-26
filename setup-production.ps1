# Script de configuração para ambiente de produção

# Verifica se está no diretório correto
if ($PWD.Path -ne (Resolve-Path "c:\Users\rcarvalho\CascadeProjects\bem-estar").Path) {
    Write-Error "Por favor, execute este script no diretório do projeto"
    exit 1
}

# Instala as dependências
Write-Host "Instalando dependências..." -ForegroundColor Green
npm install

# Gera as chaves de API necessárias
Write-Host "Gerando chaves de API..." -ForegroundColor Green
# Aqui você pode adicionar comandos para gerar chaves específicas

# Configura o Firebase
Write-Host "Configurando Firebase..." -ForegroundColor Green
firebase use production

# Configura o email
Write-Host "Configurando email..." -ForegroundColor Green
# Aqui você pode adicionar comandos para configurar o serviço de email

# Build da aplicação
Write-Host "Construindo aplicação..." -ForegroundColor Green
npm run build

# Verifica se o build foi bem sucedido
if ($LASTEXITCODE -ne 0) {
    Write-Error "Erro ao construir a aplicação"
    exit 1
}

Write-Host "Configuração concluída com sucesso!" -ForegroundColor Green
