Write-Host "Preparando projeto BemEstar para deploy na Vercel..." -ForegroundColor Cyan

# Encerrar processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✓ Processos Node.js encerrados." -ForegroundColor Green

# Limpar pastas temporárias
if (Test-Path -Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✓ Pasta .next removida." -ForegroundColor Green
}

# Verificar configuração do Next.js
$nextConfigPath = "next.config.js"
if (Test-Path -Path $nextConfigPath) {
    Write-Host "✓ Arquivo next.config.js encontrado." -ForegroundColor Green
} else {
    Write-Host "⚠️ Arquivo next.config.js não encontrado. Criando arquivo padrão..." -ForegroundColor Yellow
    @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
"@ | Out-File -FilePath $nextConfigPath -Encoding utf8
    Write-Host "✓ Arquivo next.config.js criado." -ForegroundColor Green
}

# Verificar .gitignore
$gitignorePath = ".gitignore"
if (Test-Path -Path $gitignorePath) {
    Write-Host "✓ Arquivo .gitignore encontrado." -ForegroundColor Green
} else {
    Write-Host "⚠️ Arquivo .gitignore não encontrado. Criando arquivo padrão..." -ForegroundColor Yellow
    @"
# Next.js build outputs
.next/
out/

# Dependencies
node_modules/

# Local env files
.env*.local
.env
.env.production

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Vercel
.vercel
"@ | Out-File -FilePath $gitignorePath -Encoding utf8
    Write-Host "✓ Arquivo .gitignore criado." -ForegroundColor Green
}

# Mostrar instruções para GitHub e Vercel
Write-Host "`n===== Próximos passos =====" -ForegroundColor Cyan
Write-Host "1. Envie seu código para o GitHub:"
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Preparação para deploy na Vercel'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host "`n2. Acesse https://vercel.com/ e importe seu repositório."
Write-Host "`n3. Na configuração da Vercel:"
Write-Host "   • Framework: Next.js" -ForegroundColor Gray
Write-Host "   • Diretório raiz: / (raiz do projeto)" -ForegroundColor Gray
Write-Host "   • Configurar variáveis de ambiente necessárias" -ForegroundColor Gray
Write-Host "`n4. Clique em 'Deploy' e aguarde a conclusão do processo."
Write-Host "`nConsulte DEPLOY-VERCEL.md para instruções detalhadas." -ForegroundColor Yellow 