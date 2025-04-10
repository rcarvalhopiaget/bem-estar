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

# Testar build localmente (opcional)
echo "Deseja testar o build localmente antes do deploy? (s/n)"
read testar_build

if [ "$testar_build" = "s" ]; then
    echo "Testando build localmente..."
    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Build local falhou. Corrija os erros antes de continuar com o deploy."
        exit 1
    else
        echo "✅ Build local concluído com sucesso!"
    fi
fi

# Executar deploy para o Railway com modo debug
echo "=== Iniciando deploy para o Railway ==="
echo "Iniciando deploy com log detalhado..."
railway up --debug

# Verificar status do deploy
deploy_status=$?
if [ $deploy_status -ne 0 ]; then
    echo "❌ Deploy falhou com código de saída: $deploy_status"
    echo "Verificando logs do Railway..."
    railway logs
    
    echo "Dicas para resolução de problemas:"
    echo "1. Verifique se todas as variáveis de ambiente necessárias estão configuradas no Railway"
    echo "2. Verifique se há erros de sintaxe no Dockerfile"
    echo "3. Tente aumentar o tempo limite do build no Railway Dashboard"
    echo "4. Certifique-se de que o Railway tem memória suficiente para o build"
    exit $deploy_status
else
    echo "=== Deploy concluído com sucesso! ==="
    railway open
fi 