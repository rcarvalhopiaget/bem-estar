#!/bin/bash

echo "=== Preparando deploy para Railway ==="

# Verificar instalação do CLI do Railway
if ! command -v railway &> /dev/null; then
    echo "CLI do Railway não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Verificar login
echo "Verificando login no Railway..."
railway whoami || railway login

# Verificar arquivo Dockerfile
if [ ! -f "./Dockerfile" ]; then
    echo "❌ Dockerfile não encontrado. Crie um Dockerfile válido antes de continuar."
    exit 1
fi

# Verificar arquivo .dockerignore
if [ ! -f "./.dockerignore" ]; then
    echo "❌ .dockerignore não encontrado. Crie um .dockerignore para melhorar o build."
    exit 1
fi

# Validar railway.json
if [ ! -f "./railway.json" ]; then
    echo "❌ railway.json não encontrado. Crie um arquivo de configuração railway.json."
    exit 1
fi

# Limpar caches
echo "Limpando caches e arquivos temporários..."
rm -rf .next
rm -rf node_modules/.cache

# Executar deploy para o Railway
echo "=== Iniciando deploy para o Railway ==="
railway up

echo "=== Deploy concluído! ==="
railway open 