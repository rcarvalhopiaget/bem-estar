const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===== Iniciando correção de importações do toast =====');

/**
 * Verifica se está rodando no Windows
 * @returns {boolean}
 */
function isWindows() {
  return process.platform === 'win32';
}

/**
 * Encontra arquivos que usam toast através do padrão de importação
 * @returns {string[]} Lista de caminhos dos arquivos
 */
function findFilesUsingToast() {
  try {
    let files = [];
    
    if (isWindows()) {
      // Usar PowerShell no Windows
      const command = 'powershell -Command "Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String -Pattern \\"from \'@/components/ui/toast\'\\" | ForEach-Object { $_.Path } | Sort-Object -Unique"';
      
      const result = execSync(command, { encoding: 'utf8' });
      
      files = result
        .split('\r\n')
        .filter(line => line.trim() !== '');
        
      // Buscar por arquivos que usam toast de react-hot-toast também
      const commandReactHotToast = 'powershell -Command "Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String -Pattern \\"from \'react-hot-toast\'\\" | ForEach-Object { $_.Path } | Sort-Object -Unique"';
      
      const resultReactHotToast = execSync(commandReactHotToast, { encoding: 'utf8' });
      
      const reactHotToastFiles = resultReactHotToast
        .split('\r\n')
        .filter(line => line.trim() !== '');
        
      // Combinar resultados
      files = [...new Set([...files, ...reactHotToastFiles])];
    } else {
      // Usar grep no Linux/Mac
      const toastFiles = execSync('grep -l "from \'@/components/ui/toast\'" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r src/', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim() !== '');
      
      const reactHotToastFiles = execSync('grep -l "from \'react-hot-toast\'" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r src/', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim() !== '');
        
      // Combinar resultados  
      files = [...new Set([...toastFiles, ...reactHotToastFiles])];
    }
    
    return files;
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error.message);
    
    // Método alternativo: buscar manualmente em arquivos conhecidos que usam toast
    console.log('Usando método alternativo para encontrar arquivos com toast...');
    
    const filesWithToast = [
      'src/app/dashboard/alunos/importar/page.tsx',
      'src/app/dashboard/perfil/page.tsx',
      'src/app/dashboard/restaurante/page.tsx',
      'src/app/dashboard/teste-notificacoes/page.tsx',
      'src/app/dashboard/usuarios/page.tsx',
      'src/app/admin-restaurante/page.tsx'
      // Adicione outros arquivos conhecidos aqui
    ];
    
    return filesWithToast.filter(file => fs.existsSync(file));
  }
}

/**
 * Corrige as importações de toast em um arquivo
 * @param {string} content Conteúdo do arquivo
 * @returns {string} Conteúdo modificado
 */
function fixToastImports(content) {
  let modified = content;
  
  // Substituir importações de toast de @/components/ui/toast por toast-wrapper
  modified = modified.replace(
    /import\s+\{\s*(?:useToast(?:\s*,\s*toast)?|toast(?:\s*,\s*useToast)?)\s*\}\s*from\s*['"']@\/components\/ui\/toast['"'];?/g,
    "import { useToast, toast } from '@/components/ui/toast-wrapper';"
  );
  
  // Substituir importações de react-hot-toast por toast-wrapper para unificar
  modified = modified.replace(
    /import\s+\{\s*toast\s*\}\s*from\s*['"']react-hot-toast['"'];?/g,
    "import { toast } from '@/components/ui/toast-wrapper';"
  );
  
  // Substituir importações completas de react-hot-toast
  modified = modified.replace(
    /import\s+toast\s*from\s*['"']react-hot-toast['"'];?/g,
    "import { toast } from '@/components/ui/toast-wrapper';"
  );
  
  return modified;
}

/**
 * Corrige as importações de toast em todos os arquivos
 */
function fixToastImportsInAllFiles() {
  // Encontrar arquivos que usam toast
  const files = findFilesUsingToast();
  console.log(`🔍 Encontrados ${files.length} arquivos que usam toast`);
  
  let correctedFiles = 0;
  
  // Processar cada arquivo
  for (const file of files) {
    try {
      if (!fs.existsSync(file)) {
        console.log(`⚠️ Arquivo não encontrado: ${file}`);
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      const modifiedContent = fixToastImports(content);
      
      if (modifiedContent !== content) {
        fs.writeFileSync(file, modifiedContent, 'utf8');
        console.log(`✅ Importações de toast corrigidas no arquivo: ${file}`);
        correctedFiles++;
      } else {
        console.log(`ℹ️ Nenhuma alteração necessária em: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo ${file}:`, error.message);
    }
  }
  
  console.log(`\n✨ Processo concluído: ${correctedFiles} arquivos corrigidos de ${files.length} verificados`);
}

// Executar a correção
fixToastImportsInAllFiles();

console.log('===== Correção de importações do toast concluída ====='); 