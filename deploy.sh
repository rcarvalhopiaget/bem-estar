#!/bin/bash

echo "=== Preparando deploy para Vercel ==="

# Executar scripts de preparação
echo "Corrigindo componentes UI..."
node fix-ui-components.js

echo "Criando barrel files para importações consistentes..."
node fix-ui-imports.js

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

# Build da aplicação
echo "=== Iniciando build da aplicação ==="
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
  echo "❌ Build falhou. Correção de problemas adicional pode ser necessária."
  echo "Verifique os erros acima para mais detalhes."
  exit 1
fi

# Deploy para Vercel
echo "=== Iniciando deploy para Vercel ==="
vercel --prod

# Limpeza de cache
echo "=== Limpando cache da Vercel ==="
vercel cache clear

# Verificar status do deploy
echo "=== Verificando status do deploy ==="
vercel --prod --status

echo "=== Deploy concluído! ==="
