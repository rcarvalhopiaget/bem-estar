const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Preparando projeto para deploy na Vercel ===');

// Função para criar diretório se não existir
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Função para copiar arquivo
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

// Função para ler arquivo
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Função para escrever arquivo
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Função para listar todos os arquivos .ts/.tsx recursivamente
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// ETAPA 1: Renomear componentes UI para minúsculas
console.log('\n🔍 Renomeando componentes UI para minúsculas...');
const uiComponentsDir = path.join(__dirname, 'src', 'components', 'ui');
try {
  const files = fs.readdirSync(uiComponentsDir);
  
  files.forEach(file => {
    const filePath = path.join(uiComponentsDir, file);
    const fileExt = path.extname(file);
    const fileName = path.basename(file, fileExt);
    
    // Verifica se o nome do arquivo começa com letra maiúscula
    if (fileName[0] === fileName[0].toUpperCase() && fileName[0] !== fileName[0].toLowerCase()) {
      // Cria o novo nome do arquivo com a primeira letra minúscula
      const newFileName = fileName[0].toLowerCase() + fileName.slice(1) + fileExt;
      const newFilePath = path.join(uiComponentsDir, newFileName);
      
      // Evita erro se o arquivo já existe (caso já tenha sido renomeado)
      if (!fs.existsSync(newFilePath)) {
        // Renomeia o arquivo
        fs.renameSync(filePath, newFilePath);
        console.log(`✅ Arquivo renomeado: ${file} -> ${newFileName}`);
      }
    }
  });
  console.log('✅ Componentes UI renomeados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao renomear componentes UI:', error);
}

// ETAPA 2: Criar barrel files para os componentes
console.log('\n🔍 Criando barrel files para componentes UI...');
try {
  // Lista todos os arquivos no diretório UI
  const files = fs.readdirSync(uiComponentsDir);
  
  // Nomes de componentes que precisam de barrel files
  const componentNames = ['button', 'card', 'input', 'dialog', 'toast', 'toaster', 'label', 'separator', 'switch', 'permission-alert'];
  
  componentNames.forEach(component => {
    // Procurar por todas as variações do nome do arquivo
    const variations = files.filter(file => 
      file.toLowerCase().startsWith(component.toLowerCase()) && 
      path.extname(file).toLowerCase() === '.tsx'
    );
    
    if (variations.length === 0) {
      console.log(`⚠️ Nenhum componente encontrado para ${component}`);
      return;
    }
    
    // Arquivo original (pode ser com qualquer case)
    const originalFile = variations[0];
    const fileExt = path.extname(originalFile);
    const originalName = path.basename(originalFile, fileExt);
    
    // Criar um barrel file com o nome em minúsculo
    const barrelFileName = `${component}.tsx`;
    const barrelFilePath = path.join(uiComponentsDir, barrelFileName);
    
    // Conteúdo do barrel file
    const barrelContent = `// Barrel file para compatibilidade com diferentes sistemas de arquivos
export * from './${originalName}';
`;
    
    // Só cria o barrel file se já não existe um arquivo com o mesmo nome
    if (!fs.existsSync(barrelFilePath) || path.basename(originalFile) !== barrelFileName) {
      fs.writeFileSync(barrelFilePath, barrelContent, 'utf8');
      console.log(`✅ Barrel file criado: ${barrelFileName} -> ${originalName}${fileExt}`);
    }
  });
  console.log('✅ Barrel files criados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao criar barrel files:', error);
}

// ETAPA 3: Corrigir importações nos arquivos
console.log('\n🔍 Verificando e corrigindo importações...');
try {
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findTsFiles(srcDir);
  console.log(`Encontrados ${tsFiles.length} arquivos .ts/.tsx para verificar`);
  
  let fixedCount = 0;
  
  // Componentes UI a serem corrigidos
  const componentsToFix = [
    'button',
    'card',
    'input',
    'dialog',
    'toast',
    'toaster',
    'label',
    'separator',
    'switch',
    'permission-alert'
  ];
  
  // Processar cada arquivo
  tsFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let wasModified = false;
    
    // Verificar importações com case incorreto
    componentsToFix.forEach(component => {
      // Regex para encontrar importações com qualquer variação de case
      const regex = new RegExp(`from\\s+['"]@/components/ui/([^'"]*${component}[^'"]*)['"]`, 'gi');
      
      // Substituir por versão correta com lowercase
      const modifiedContent = content.replace(regex, (match, importedPath) => {
        // Captura apenas o caminho do componente, não a expressão completa
        return `from '@/components/ui/${component}'`;
      });
      
      if (content !== modifiedContent) {
        content = modifiedContent;
        wasModified = true;
      }
    });
    
    // Se houver mudanças, salvar o arquivo
    if (wasModified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Importações corrigidas em: ${path.relative(__dirname, file)}`);
      fixedCount++;
    }
  });
  
  console.log(`✅ ${fixedCount} arquivos tiveram importações atualizadas.`);
} catch (error) {
  console.error('❌ Erro ao corrigir importações:', error);
}

// ETAPA 4: Corrigir dependência do Firebase no dataconnect
console.log('\n🔍 Verificando configurações do Firebase connector...');
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

// ETAPA 5: Verificar e criar .vercelignore se necessário
console.log('\n🔍 Verificando arquivo .vercelignore...');
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
prepare-vercel-deploy.js`;
    
    fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent, 'utf8');
    console.log('✅ Arquivo .vercelignore criado');
  } else {
    console.log('ℹ️ Arquivo .vercelignore já existe');
  }
} catch (error) {
  console.error('❌ Erro ao criar arquivo .vercelignore:', error);
}

// ETAPA 6: Verificar e atualizar o arquivo vercel.json
console.log('\n🔍 Verificando arquivo vercel.json...');
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

// Função principal
function prepareForVercel() {
  console.log('Preparando projeto para deploy na Vercel...');

  // 1. Criar diretório .vercel se não existir
  ensureDirectoryExists('.vercel');

  // 2. Copiar arquivos de configuração necessários
  const configFiles = [
    'next.config.js',
    'package.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.js'
  ];

  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      copyFile(file, path.join('.vercel', file));
      console.log(`✓ Copiado ${file}`);
    }
  });

  // 3. Criar arquivo de configuração do projeto
  const projectConfig = {
    name: 'bem-estar',
    framework: 'nextjs',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    installCommand: 'npm install',
    devCommand: 'npm run dev'
  };

  writeFile(
    path.join('.vercel', 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  console.log('✓ Criado project.json');

  // 4. Criar arquivo de configuração de ambiente
  const envConfig = {
    production: true,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
      EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
      EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_TEST_MODE: process.env.EMAIL_TEST_MODE,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
      NEXT_PUBLIC_CACHE_TTL: process.env.NEXT_PUBLIC_CACHE_TTL,
      NEXT_PUBLIC_CACHE_MAX_AGE: process.env.NEXT_PUBLIC_CACHE_MAX_AGE
    }
  };

  writeFile(
    path.join('.vercel', 'env.json'),
    JSON.stringify(envConfig, null, 2)
  );
  console.log('✓ Criado env.json');

  console.log('\nPreparação concluída! Agora você pode fazer o deploy usando:');
  console.log('vercel deploy');
}

// Executar preparação
prepareForVercel();

console.log('\n=== Projeto preparado para deploy! 🚀 ===');
console.log('\nPróximos passos:');
console.log('1. Commit das alterações: git add . && git commit -m "Preparado para deploy na Vercel"');
console.log('2. Push para o repositório: git push');
console.log('3. Deploy na Vercel: https://vercel.com/new\n');
console.log('Consulte o arquivo VERCEL-DEPLOY.md para instruções detalhadas.'); 