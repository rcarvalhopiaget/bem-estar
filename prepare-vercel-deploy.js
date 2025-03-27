const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparando projeto para deploy na Vercel...');

// 1. Renomear componentes UI para minúsculas
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
        console.log(`Arquivo renomeado: ${file} -> ${newFileName}`);
      }
    }
  });
  console.log('✅ Componentes UI renomeados com sucesso');
} catch (error) {
  console.error('❌ Erro ao renomear componentes UI:', error);
}

// 2. Corrigir dependência do Firebase no dataconnect
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

// 3. Verificar e criar .vercelignore se necessário
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
prepare-vercel-deploy.js`;
    
    fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent, 'utf8');
    console.log('✅ Arquivo .vercelignore criado');
  } else {
    console.log('ℹ️ Arquivo .vercelignore já existe');
  }
} catch (error) {
  console.error('❌ Erro ao criar arquivo .vercelignore:', error);
}

console.log('\nProjeto preparado para deploy! 🚀');
console.log('\nPróximos passos:');
console.log('1. Commit das alterações: git add . && git commit -m "Preparado para deploy na Vercel"');
console.log('2. Push para o repositório: git push');
console.log('3. Deploy na Vercel: https://vercel.com/new');
console.log('\nConsulte o arquivo VERCEL-DEPLOY.md para instruções detalhadas.'); 