# Script para resolver problemas de dependências do Next.js
Write-Host "Corrigindo problemas de dependências do Next.js..." -ForegroundColor Cyan

# Removendo node_modules e package-lock.json
if (Test-Path -Path "node_modules") {
    Write-Host "Removendo pasta node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path -Path "package-lock.json") {
    Write-Host "Removendo package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
}

if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
}

# Limpar o cache do npm
Write-Host "Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force

# Atualizando next.config.js
Write-Host "Atualizando next.config.js..." -ForegroundColor Yellow
$nextConfig = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
"@

Set-Content -Path next.config.js -Value $nextConfig

# Instalando versões específicas que funcionam bem juntas
Write-Host "Instalando versões estáveis do Next.js e React..." -ForegroundColor Green
npm install next@13.5.6 react@18.2.0 react-dom@18.2.0 --save --legacy-peer-deps

# Instalando outras dependências importantes
Write-Host "Instalando dependências essenciais..." -ForegroundColor Green
npm install @mui/material firebase react-hook-form zod @radix-ui/react-toast caniuse-lite@latest --save --legacy-peer-deps

# Instalando todas as dependências restantes
Write-Host "Instalando dependências restantes..." -ForegroundColor Green
npm install --legacy-peer-deps

# Corrigindo problemas de case-sensitivity
Write-Host "Executando script para corrigir problemas de case-sensitivity..." -ForegroundColor Yellow
if (Test-Path -Path "corrigir-toast.ps1") {
    & ./corrigir-toast.ps1
} else {
    Write-Host "Script corrigir-toast.ps1 não encontrado. Pulando esta etapa." -ForegroundColor Red
}

# Gerando build
Write-Host "Gerando build de produção..." -ForegroundColor Green
npm run build

# Verificando se a build foi bem-sucedida
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao gerar build! Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host "Build concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o servidor em modo de produção, execute:" -ForegroundColor Cyan
Write-Host "./iniciar-producao.ps1" -ForegroundColor White 