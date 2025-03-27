const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Preparando deploy para Vercel com módulos UI ===');

// ETAPA: Criar módulos de componentes UI
console.log('\n🔧 Criando módulos de componentes UI...');
try {
  require('./create-ui-modules.js');
} catch (error) {
  console.error('❌ Erro ao criar módulos UI:', error);
  process.exit(1);
}

// ETAPA: Corrigir importações nas páginas
console.log('\n🔧 Corrigindo importações nas páginas...');
try {
  require('./fix-page-imports.js');
} catch (error) {
  console.error('❌ Erro ao corrigir importações:', error);
  process.exit(1);
}

// ETAPA: Corrigir uso do Firebase em todos os arquivos
console.log('\n🔧 Corrigindo uso do Firebase em todos os arquivos...');
try {
  require('./fix-firebase-db.js');
} catch (error) {
  console.error('❌ Erro ao corrigir uso do Firebase:', error);
  console.log('⚠️ Continuando sem a correção automática do Firebase');
}

// ETAPA: Verificar se as dependências estão instaladas
console.log('\n🔧 Verificando dependências necessárias...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = [
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    '@radix-ui/react-switch'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`Instalando dependências ausentes: ${missingDeps.join(', ')}`);
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependências instaladas com sucesso');
  } else {
    console.log('✅ Todas as dependências necessárias já estão instaladas');
  }
} catch (error) {
  console.error('❌ Erro ao verificar dependências:', error);
  process.exit(1);
}

// ETAPA: Corrigir dependência do Firebase no dataconnect
console.log('\n🔧 Verificando configurações do Firebase connector...');
const connectorPackageJsonPath = path.join(__dirname, 'dataconnect-generated', 'js', 'default-connector', 'package.json');
try {
  if (fs.existsSync(connectorPackageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(connectorPackageJsonPath, 'utf8'));
    
    if (packageJson.peerDependencies && packageJson.peerDependencies.firebase === '^11.3.0') {
      packageJson.peerDependencies.firebase = '^10.8.1';
      fs.writeFileSync(connectorPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('✅ Dependência do Firebase atualizada no connector');
    } else {
      console.log('ℹ️ Dependência do Firebase já está atualizada');
    }
  } else {
    console.log('⚠️ Arquivo package.json do connector não encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao atualizar dependência do Firebase:', error);
}

// ETAPA: Corrigir uso do Firebase nos componentes
console.log('\n🔧 Corrigindo uso do Firebase nos componentes...');
try {
  const adminRestaurantePath = path.join(__dirname, 'src', 'app', 'admin-restaurante', 'page.tsx');
  
  if (fs.existsSync(adminRestaurantePath)) {
    let content = fs.readFileSync(adminRestaurantePath, 'utf8');
    
    // Verificar se o arquivo já tem a verificação null
    if (!content.includes('if (!db)')) {
      // Adicionar verificação de null para o Firebase db
      content = content.replace(
        /const handleAtualizarUsuario = async \(\) => {[\s\S]*?try {[\s\S]*?setIsLoading\(true\);[\s\S]*?setResultado\(null\);/g,
        `const handleAtualizarUsuario = async () => {
    try {
      setIsLoading(true);
      setResultado(null);

      // Verificar se o db está disponível
      if (!db) {
        setResultado("Erro: Banco de dados não está disponível no momento");
        toast.error("Erro ao conectar ao banco de dados");
        return;
      }`
      );
      
      fs.writeFileSync(adminRestaurantePath, content, 'utf8');
      console.log('✅ Verificação de db nulo adicionada ao arquivo admin-restaurante/page.tsx');
    } else {
      console.log('ℹ️ Verificação de db nulo já existente');
    }
  } else {
    console.log('⚠️ Arquivo admin-restaurante/page.tsx não encontrado');
  }
  
  // Correção do admin/create-admin/route.ts
  const adminCreatePath = path.join(__dirname, 'src', 'app', 'api', 'admin', 'create-admin', 'route.ts');
  if (fs.existsSync(adminCreatePath)) {
    let content = fs.readFileSync(adminCreatePath, 'utf8');
    
    // Verificar se o arquivo já tem a verificação null
    if (!content.includes('if (!db)')) {
      // Adicionar verificação de null para o Firebase db
      content = content.replace(
        /export async function GET\(\) {[\s\S]*?try {[\s\S]*?const email = [^;]*;/g,
        `export async function GET() {
  try {
    const email = 'rodrigo.carvalho@jpiaget.com.br';
    
    // Verificar se o banco de dados está disponível
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }`
      );
      
      fs.writeFileSync(adminCreatePath, content, 'utf8');
      console.log('✅ Verificação de db nulo adicionada ao arquivo api/admin/create-admin/route.ts');
    } else {
      console.log('ℹ️ Verificação de db nulo já existente em api/admin/create-admin/route.ts');
    }
  }
} catch (error) {
  console.error('❌ Erro ao corrigir uso do Firebase:', error);
}

// ETAPA: Verificar e criar .vercelignore se necessário
console.log('\n🔧 Verificando arquivo .vercelignore...');
const vercelIgnorePath = path.join(__dirname, '.vercelignore');
try {
  if (!fs.existsSync(vercelIgnorePath)) {
    const vercelIgnoreContent = `# Ignorar arquivos relacionados a submódulos Git
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
fix-firebase-db.js
vercel-deploy.js
VERCEL-DEPLOY-UPDATED.md
PROCEDIMENTO-DE-TESTES.md
RESUMO-SOLUCAO.md
CONCLUSAO.md`;
    
    fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent, 'utf8');
    console.log('✅ Arquivo .vercelignore criado');
  } else {
    console.log('ℹ️ Arquivo .vercelignore já existe');
  }
} catch (error) {
  console.error('❌ Erro ao criar arquivo .vercelignore:', error);
}

// ETAPA: Verificar e atualizar o arquivo vercel.json
console.log('\n🔧 Verificando arquivo vercel.json...');
const vercelJsonPath = path.join(__dirname, 'vercel.json');
try {
  if (fs.existsSync(vercelJsonPath)) {
    let vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Garantir que o campo "builds" está correto
    if (!vercelJson.builds || !vercelJson.builds.length) {
      vercelJson.builds = [
        {
          "src": "package.json",
          "use": "@vercel/next"
        }
      ];
      fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2), 'utf8');
      console.log('✅ Campo "builds" adicionado ao vercel.json');
    }
    
    console.log('ℹ️ Arquivo vercel.json já existente e verificado');
  } else {
    console.log('⚠️ Arquivo vercel.json não encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao verificar arquivo vercel.json:', error);
}

// Executar build para testar
console.log('\n🔧 Executando build de teste...');
try {
  console.log('\nResultado do build (isso pode demorar um pouco):\n');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Build concluído com sucesso!');
} catch (error) {
  console.error('\n❌ Erro no build:', error.message);
  console.log('\nVerifique os erros acima. Se necessário, execute manualmente os comandos de correção adicionais.');
  process.exit(1);
}

console.log('\n=== Projeto preparado para deploy! 🚀 ===');
console.log('\nPróximos passos para deploy na Vercel:');
console.log('1. Commit das alterações: git add . && git commit -m "Fix: Solução com módulos UI separados"');
console.log('2. Push para o repositório: git push');
console.log('3. Acesse a dashboard da Vercel: https://vercel.com/dashboard');
console.log('4. Inicie um novo deploy: https://vercel.com/new\n');
console.log('Se preferir deploy via CLI:');
console.log('- vercel login');
console.log('- vercel --prod\n'); 