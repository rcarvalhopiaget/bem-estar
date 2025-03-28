# Script para corrigir problemas de versão do Next.js e React
# ------------------------------------------------------------------------------

Write-Host "🔄 Iniciando correção de versões Next.js e React..." -ForegroundColor Cyan

# Verificar se está rodando em ambiente Windows
if (-not $IsWindows -and -not ($PSVersionTable.PSVersion.Major -lt 6)) {
    Write-Host "❌ Este script foi projetado para Windows. Em outros sistemas, ajuste os comandos conforme necessário." -ForegroundColor Red
    exit 1
}

# Função para encerrar processos
function Stop-ProcessesByName {
    param (
        [string[]]$Names
    )
    
    foreach ($name in $Names) {
        $processes = Get-Process -Name $name -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "🛑 Encerrando processos $name..." -ForegroundColor Yellow
            Stop-Process -Name $name -Force -ErrorAction SilentlyContinue
        }
    }
}

# Encerrar processos que podem estar bloqueando arquivos
Write-Host "🔍 Verificando e encerrando processos que podem estar bloqueando os arquivos..." -ForegroundColor Cyan
Stop-ProcessesByName -Names @("node", "npm")

# Remover diretório .next
if (Test-Path -Path ".next") {
    Write-Host "🗑️ Removendo diretório .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    
    if (Test-Path -Path ".next") {
        Write-Host "⚠️ Não foi possível remover completamente o diretório .next. Verifique se há processos bloqueando." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Diretório .next removido com sucesso." -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️ Diretório .next não encontrado. Continuando..." -ForegroundColor Gray
}

# Limpar cache do NPM
Write-Host "🧹 Limpando cache do NPM..." -ForegroundColor Cyan
npm cache clean --force

# Verificar versões atuais instaladas
Write-Host "🔍 Verificando versões instaladas..." -ForegroundColor Cyan
$nextVersion = (npm list next --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies.next.version
$reactVersion = (npm list react --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies.react.version
$reactDomVersion = (npm list react-dom --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies."react-dom".version

Write-Host "📦 Versões atuais:" -ForegroundColor Cyan
Write-Host " - Next.js: $nextVersion" -ForegroundColor Gray
Write-Host " - React: $reactVersion" -ForegroundColor Gray
Write-Host " - React DOM: $reactDomVersion" -ForegroundColor Gray

# Desinstalar versões atuais para limpar
Write-Host "🗑️ Desinstalando versões atuais para reinstalação limpa..." -ForegroundColor Yellow
npm uninstall next react react-dom --silent

# Instalar versões compatíveis
Write-Host "📦 Instalando versões compatíveis..." -ForegroundColor Cyan
npm install next@13.5.6 react@18.2.0 react-dom@18.2.0 --save --silent

# Verificar se a instalação foi bem-sucedida
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar as dependências. Tentando novamente com --legacy-peer-deps..." -ForegroundColor Red
    npm install next@13.5.6 react@18.2.0 react-dom@18.2.0 --save --legacy-peer-deps --silent
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao instalar as dependências mesmo com --legacy-peer-deps. Verifique a conexão à internet e tente novamente." -ForegroundColor Red
        exit 1
    }
}

# Verificar versões instaladas após atualização
$newNextVersion = (npm list next --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies.next.version
$newReactVersion = (npm list react --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies.react.version
$newReactDomVersion = (npm list react-dom --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue).dependencies."react-dom".version

Write-Host "✅ Versões instaladas com sucesso:" -ForegroundColor Green
Write-Host " - Next.js: $newNextVersion" -ForegroundColor White
Write-Host " - React: $newReactVersion" -ForegroundColor White
Write-Host " - React DOM: $newReactDomVersion" -ForegroundColor White

# Limpar e recompilar
Write-Host "🔄 Limpando e recompilando o projeto..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Ocorreram erros durante a compilação. Verifique os erros acima e corrija-os antes de prosseguir." -ForegroundColor Yellow
} else {
    Write-Host "✅ Compilação concluída com sucesso!" -ForegroundColor Green
}

Write-Host "✨ Processo de correção de versões concluído!" -ForegroundColor Cyan
Write-Host "ℹ️ Você pode iniciar o servidor de produção com o comando: npm run start" -ForegroundColor Gray 