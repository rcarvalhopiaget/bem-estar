const fs = require('fs');
const path = require('path');

const uiComponentsDir = path.join(__dirname, 'src', 'components', 'ui');

// Verificar se o diretório existe
if (!fs.existsSync(uiComponentsDir)) {
  console.error('Diretório UI não encontrado:', uiComponentsDir);
  process.exit(1);
}

// Função para criar barrel files
function createBarrelFiles() {
  console.log('Criando barrel files para componentes UI...');
  
  // Lista todos os arquivos no diretório UI
  const files = fs.readdirSync(uiComponentsDir);
  
  // Nomes de componentes que precisam de barrel files
  const componentNames = ['button', 'card', 'input', 'dialog', 'toast', 'label', 'separator', 'switch'];
  
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
    } else {
      console.log(`ℹ️ Arquivo já existe: ${barrelFileName}`);
    }
  });
}

// Função principal
function main() {
  try {
    createBarrelFiles();
    console.log('\n✅ Todos os barrel files foram criados com sucesso!');
    console.log('Isso ajudará a resolver problemas de sensibilidade de case nas importações.');
  } catch (error) {
    console.error('\n❌ Erro ao processar arquivos:', error);
    process.exit(1);
  }
}

main(); 