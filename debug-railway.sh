#!/bin/bash

echo "=== Script de Debug para Railway ==="

# Detectando node e npm
echo "Versão do Node.js:"
node -v
echo "Versão do NPM:"
npm -v

# Verificando diretórios e arquivos importantes
echo -e "\nVerificando diretórios e arquivos..."
if [ -d "src" ]; then echo "✅ Diretório src encontrado"; else echo "❌ Diretório src não encontrado"; fi
if [ -d "public" ]; then echo "✅ Diretório public encontrado"; else echo "❌ Diretório public não encontrado"; fi
if [ -f "next.config.js" ]; then echo "✅ next.config.js encontrado"; else echo "❌ next.config.js não encontrado"; fi
if [ -f "package.json" ]; then echo "✅ package.json encontrado"; else echo "❌ package.json não encontrado"; fi

# Verificar script de build
echo -e "\nVerificando script de build no package.json..."
BUILD_SCRIPT=$(grep '"build"' package.json | head -1)
echo "Script de build: $BUILD_SCRIPT"

# Limpar caches antes de testar
echo -e "\nLimpando caches..."
rm -rf .next
rm -rf node_modules/.cache

# Variáveis de ambiente para diagnóstico
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_TYPECHECK=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Instalar dependências de forma limpa
echo -e "\nInstalando dependências..."
npm ci

# Instalar sharp explicitamente
echo -e "\nInstalando sharp..."
npm install sharp --no-save

# Tentar build com saída detalhada
echo -e "\nExecutando build com diagnóstico..."
npm run build --verbose

# Verificar resultado
if [ $? -eq 0 ]; then
    echo -e "\n✅ Build local concluído com sucesso!"
else
    echo -e "\n❌ Build falhou. Verificando problemas comuns..."
    # Verificar problemas comuns
    echo "1. Verificando erros de memória..."
    dmesg | grep -i "out of memory" | tail -5
    
    echo "2. Verificando espaço em disco..."
    df -h
    
    echo "3. Verificando conteúdo da pasta /tmp..."
    ls -la /tmp
    
    echo -e "\nSugestões para resolver problemas:"
    echo "- Aumentar o limite de memória no NODE_OPTIONS"
    echo "- Simplificar ainda mais o next.config.js"
    echo "- Considerar usar standalone=false no next.config.js"
    echo "- Verificar se há atualizações necessárias nas dependências"
fi 