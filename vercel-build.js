const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar e criar tsconfig.tsbuildinfo vazio se não existir
console.log('🔍 Verificando tsconfig.tsbuildinfo...');
if (!fs.existsSync('./.next/tsconfig.tsbuildinfo')) {
  try {
    // Criar diretório .next se não existir
    if (!fs.existsSync('./.next')) {
      fs.mkdirSync('./.next', { recursive: true });
    }
    fs.writeFileSync('./.next/tsconfig.tsbuildinfo', '{}');
    console.log('✅ tsconfig.tsbuildinfo criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tsconfig.tsbuildinfo:', error);
  }
}

// REMOVIDO: Verificações e criações de arquivos placeholder (globals.css, AuthContext, utils, componentes UI, configs Tailwind)
// O build deve usar os arquivos do repositório.

// Criar/modificar gitignore para ignorar node_modules
// MANTIDO pois é útil para garantir que node_modules não seja commitado acidentalmente
if (!fs.existsSync('./.gitignore')) {
  try {
    fs.writeFileSync('./.gitignore', `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`);
    console.log('✅ .gitignore criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar .gitignore:', error);
  }
}

// Instalar dependências
console.log('📦 Instalando dependências (pode demorar um pouco)...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error);
  process.exit(1); // Sair se a instalação falhar
}

// Executar o build do Next.js
console.log('🔨 Executando build do Next.js...');
try {
  // Vercel deve setar NODE_ENV=production automaticamente no ambiente de build final.
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o build:', error);
  process.exit(1);
}
