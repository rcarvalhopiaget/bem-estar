const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Verificando e corrigindo importações em arquivos...');

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

// Encontrar todos os arquivos TypeScript no projeto
try {
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findTsFiles(srcDir);
  console.log(`Encontrados ${tsFiles.length} arquivos .ts/.tsx para verificar`);
  
  let fixedCount = 0;
  
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
  
  console.log(`\n✅ Processo concluído. ${fixedCount} arquivos foram atualizados.`);
} catch (error) {
  console.error('❌ Erro ao processar arquivos:', error);
} 