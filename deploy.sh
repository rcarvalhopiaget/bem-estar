#!/bin/bash

echo "=== Preparando deploy para Vercel ==="

# Executar o script principal
if [ -f "vercel-deploy.js" ]; then
  echo "Executando script de preparação principal (vercel-deploy.js)..."
  node vercel-deploy.js
  
  if [ $? -ne 0 ]; then
    echo "❌ Script de preparação falhou. Corrija os erros antes de continuar."
    exit 1
  fi
else
  # Se o script principal não existir, executar etapas individuais
  
  # Criar módulos de componentes UI
  echo "Criando módulos de componentes UI..."
  node create-ui-modules.js
  
  if [ $? -ne 0 ]; then
    echo "❌ Falha ao criar módulos UI."
    exit 1
  fi

  # Corrigir importações nas páginas
  echo "Corrigindo importações nas páginas..."
  node fix-page-imports.js
  
  if [ $? -ne 0 ]; then
    echo "❌ Falha ao corrigir importações."
    exit 1
  fi

  # Instalar dependências necessárias
  echo "Verificando dependências necessárias..."
  npm install clsx tailwind-merge class-variance-authority @radix-ui/react-switch
  
  # Verificar configurações do Firebase connector
  echo "Verificando configurações do Firebase connector..."
  node -e "
  const fs = require('fs');
  const path = require('path');
  const connectorPath = path.join(__dirname, 'dataconnect-generated', 'js', 'default-connector', 'package.json');
  if (fs.existsSync(connectorPath)) {
    const pkg = JSON.parse(fs.readFileSync(connectorPath, 'utf8'));
    if (pkg.peerDependencies && pkg.peerDependencies.firebase === '^11.3.0') {
      pkg.peerDependencies.firebase = '^10.8.1';
      fs.writeFileSync(connectorPath, JSON.stringify(pkg, null, 2));
      console.log('Versão do Firebase atualizada no connector');
    } else {
      console.log('Versão do Firebase já está atualizada');
    }
  } else {
    console.log('Arquivo package.json do connector não encontrado');
  }
  "
  
  # Verificar e criar .vercelignore
  echo "Verificando arquivo .vercelignore..."
  if [ ! -f ".vercelignore" ]; then
    cat > .vercelignore << EOF
# Ignorar arquivos relacionados a submódulos Git
.git
.gitmodules

# Ignorar arquivos desnecessários para o build
node_modules
.github
.vscode

# Ignorar scripts de desenvolvimento
*.ps1
fix-ui-components.js
fix-imports.js
fix-ui-imports.js
patch-imports.js
prepare-vercel-deploy.js
fix-ui-direct.js
create-ui-modules.js
fix-page-imports.js
EOF
    echo "Arquivo .vercelignore criado"
  else
    echo "Arquivo .vercelignore já existe"
  fi
  
  # Build da aplicação
  echo "=== Iniciando build da aplicação ==="
  npm run build
  
  if [ $? -ne 0 ]; then
    echo "❌ Build falhou. Correção de problemas adicional pode ser necessária."
    echo "Verifique os erros acima para mais detalhes."
    exit 1
  fi
fi

# Commit das alterações (se necessário)
echo "=== Gerando commit com as alterações ==="
read -p "Deseja adicionar e fazer commit das alterações? (s/n): " MAKE_COMMIT
if [ "$MAKE_COMMIT" = "s" ]; then
  git add .
  git commit -m "Fix: Solução com módulos UI separados para deploy na Vercel"
  
  # Verificar se há um repositório remoto configurado
  REMOTE_EXISTS=$(git remote)
  if [ -n "$REMOTE_EXISTS" ]; then
    read -p "Deseja enviar as alterações para o repositório remoto? (s/n): " PUSH_CHANGES
    if [ "$PUSH_CHANGES" = "s" ]; then
      git push
    fi
  fi
fi

# Deploy para Vercel
echo "=== Iniciando deploy para Vercel ==="
read -p "Deseja iniciar o deploy para a Vercel agora? (s/n): " START_DEPLOY
if [ "$START_DEPLOY" = "s" ]; then
  # Verificar se CLI da Vercel está instalada
  if ! command -v vercel &> /dev/null; then
    echo "CLI da Vercel não encontrada. Instalando..."
    npm install -g vercel
  fi
  
  # Verificar login
  VERCEL_TOKEN=$(vercel whoami 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "Fazendo login na Vercel..."
    vercel login
  fi
  
  # Deploy
  vercel --prod
  
  # Limpeza de cache
  echo "=== Limpando cache da Vercel ==="
  vercel cache clear
  
  # Verificar status do deploy
  echo "=== Verificando status do deploy ==="
  vercel --prod --status
else
  echo "Deploy não iniciado. Você pode fazer o deploy manualmente com:"
  echo "  vercel --prod"
fi

echo "=== Processo de preparação para deploy concluído! ==="
