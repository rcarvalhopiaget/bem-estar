const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===== Iniciando correção de verificação do Firebase db =====');

/**
 * Verifica se está rodando no Windows
 * @returns {boolean}
 */
function isWindows() {
  return process.platform === 'win32';
}

/**
 * Encontra arquivos que usam o Firebase db através do padrão collection(db)
 * @returns {string[]} Lista de caminhos dos arquivos
 */
function findFilesUsingFirebaseDb() {
  try {
    let files = [];
    
    if (isWindows()) {
      // Usar PowerShell no Windows
      const command = 'powershell -Command "Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String -Pattern \\"collection\\(db\\" | ForEach-Object { $_.Path } | Sort-Object -Unique"';
      
      const result = execSync(command, { encoding: 'utf8' });
      
      files = result
        .split('\r\n')
        .filter(line => line.trim() !== '');
    } else {
      // Usar grep no Linux/Mac
      const grepCommand = 'grep -r "collection(db)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/';
      const result = execSync(grepCommand, { encoding: 'utf8' });
      
      files = result
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.split(':')[0])
        .filter((file, index, self) => self.indexOf(file) === index); // Remover duplicados
    }
    
    return files;
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error.message);
    
    // Método alternativo: buscar manualmente em arquivos conhecidos
    console.log('Usando método alternativo para encontrar arquivos...');
    
    const filesWithFirebaseDb = [
      'src/services/usuarioService.ts',
      'src/services/refeicaoService.ts',
      'src/services/logService.ts',
      'src/services/atividadeService.ts',
      'src/services/alunoService.ts',
      'src/app/dashboard/admin/verificar-usuarios/page.tsx',
      'src/app/dashboard/admin/page.tsx',
      'src/app/api/atualizar-usuario-restaurante/route.ts',
      'src/app/api/agendar-relatorio/route.ts',
      'src/app/api/admin/route.ts',
      'src/app/api/admin/create-admin/route.ts',
      'src/app/admin-restaurante/page.tsx'
    ];
    
    return filesWithFirebaseDb.filter(file => fs.existsSync(file));
  }
}

/**
 * Verifica se o arquivo já possui verificação para db nulo
 * @param {string} content Conteúdo do arquivo
 * @returns {boolean}
 */
function hasDbNullCheck(content) {
  return content.includes('if (!db)') || 
         content.includes('if (db === null)') || 
         content.includes('db === null') || 
         content.includes('db !== null');
}

/**
 * Adiciona verificação de db nulo em arquivos de API (route.ts)
 * @param {string} content Conteúdo do arquivo
 * @returns {string} Conteúdo modificado
 */
function addDbNullCheckToApiFile(content) {
  let modified = content;
  
  // Para rotas de API com GET
  if (content.includes('export async function GET')) {
    modified = modified.replace(
      /(export async function GET\([^)]*\)\s*{[^{]*try\s*{)/,
      '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      return NextResponse.json(\n        { success: false, error: \'Banco de dados não disponível\' },\n        { status: 500 }\n      );\n    }\n'
    );
  }
  
  // Para rotas de API com POST
  if (content.includes('export async function POST')) {
    modified = modified.replace(
      /(export async function POST\([^)]*\)\s*{[^{]*try\s*{)/,
      '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      return NextResponse.json(\n        { success: false, error: \'Banco de dados não disponível\' },\n        { status: 500 }\n      );\n    }\n'
    );
  }
  
  // Para rotas de API com PUT
  if (content.includes('export async function PUT')) {
    modified = modified.replace(
      /(export async function PUT\([^)]*\)\s*{[^{]*try\s*{)/,
      '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      return NextResponse.json(\n        { success: false, error: \'Banco de dados não disponível\' },\n        { status: 500 }\n      );\n    }\n'
    );
  }
  
  // Para rotas de API com DELETE
  if (content.includes('export async function DELETE')) {
    modified = modified.replace(
      /(export async function DELETE\([^)]*\)\s*{[^{]*try\s*{)/,
      '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      return NextResponse.json(\n        { success: false, error: \'Banco de dados não disponível\' },\n        { status: 500 }\n      );\n    }\n'
    );
  }
  
  return modified;
}

/**
 * Adiciona verificação de db nulo em arquivos de componentes
 * @param {string} content Conteúdo do arquivo
 * @returns {string} Conteúdo modificado
 */
function addDbNullCheckToComponentFile(content) {
  // Para funções em componentes que usam useCallback ou useEffect
  let modified = content;
  
  // Para funções usando useCallback
  modified = modified.replace(
    /(const \w+ = useCallback\(\s*(?:async\s*)?\(\)\s*=>\s*{[^{]*try\s*{)/g,
    '$1\n      // Verificar se o banco de dados está disponível\n      if (!db) {\n        toast?.error?.("Erro ao conectar ao banco de dados");\n        return;\n      }\n'
  );
  
  // Para funções assíncronas comuns
  modified = modified.replace(
    /(const \w+ = async\s*\([^)]*\)\s*=>\s*{[^{]*try\s*{)/g,
    '$1\n      // Verificar se o banco de dados está disponível\n      if (!db) {\n        toast?.error?.("Erro ao conectar ao banco de dados");\n        return;\n      }\n'
  );
  
  // Para useEffect hooks
  modified = modified.replace(
    /(useEffect\(\s*\(\)\s*=>\s*{[^{]*(?:async\s*)?(?:function\s*\w+\s*\([^)]*\))?\s*{[^{]*try\s*{)/g,
    '$1\n        // Verificar se o banco de dados está disponível\n        if (!db) {\n          console.error("Banco de dados não disponível");\n          return;\n        }\n'
  );
  
  return modified;
}

/**
 * Adiciona verificação de db nulo em arquivos de serviços
 * @param {string} content Conteúdo do arquivo
 * @returns {string} Conteúdo modificado
 */
function addDbNullCheckToServiceFile(content) {
  // Para métodos em arquivos de serviço
  let modified = content;
  
  // Para métodos de serviço assíncronos
  modified = modified.replace(
    /(export\s+async\s+function\s+\w+\([^)]*\)\s*{[^{]*try\s*{)/g,
    '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      throw new Error("Banco de dados não disponível");\n    }\n'
  );
  
  // Para métodos de classe assíncronos
  modified = modified.replace(
    /(async\s+\w+\([^)]*\)\s*{[^{]*try\s*{)/g,
    '$1\n    // Verificar se o banco de dados está disponível\n    if (!db) {\n      throw new Error("Banco de dados não disponível");\n    }\n'
  );
  
  return modified;
}

/**
 * Corrige arquivos que usam o Firebase db sem verificação de null
 */
function fixFirebaseDb() {
  // Verificar arquivos críticos conhecidos manualmente
  const criticalFiles = [
    'src/app/admin-restaurante/page.tsx',
    'src/app/api/admin/create-admin/route.ts'
  ];
  
  console.log('🔍 Verificando arquivos críticos conhecidos...');
  
  let correctedFiles = 0;
  let totalFilesChecked = 0;
  
  // Processar cada arquivo crítico
  for (const file of criticalFiles) {
    try {
      if (!fs.existsSync(file)) {
        console.log(`⚠️ Arquivo crítico não encontrado: ${file}`);
        continue;
      }
      
      totalFilesChecked++;
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar se já tem verificação de db nulo
      if (hasDbNullCheck(content)) {
        console.log(`✓ Arquivo crítico ${file} já possui verificação de db nulo`);
        continue;
      }
      
      // Aplicar correção com base no tipo de arquivo
      let modifiedContent = content;
      
      if (file.includes('/api/') && file.endsWith('route.ts')) {
        // Para arquivos de API
        modifiedContent = addDbNullCheckToApiFile(content);
      } else if (file.includes('/services/')) {
        // Para arquivos de serviço
        modifiedContent = addDbNullCheckToServiceFile(content);
      } else {
        // Para componentes e outros tipos
        modifiedContent = addDbNullCheckToComponentFile(content);
      }
      
      if (modifiedContent !== content) {
        fs.writeFileSync(file, modifiedContent, 'utf8');
        console.log(`✅ Verificação de db nulo adicionada ao arquivo crítico ${file}`);
        correctedFiles++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo crítico ${file}:`, error.message);
    }
  }
  
  // Tentar encontrar outros arquivos que usam o Firebase db
  try {
    const files = findFilesUsingFirebaseDb().filter(f => !criticalFiles.includes(f));
    console.log(`\n🔍 Encontrados ${files.length} arquivos adicionais que usam o Firebase db`);
    
    // Processar cada arquivo adicional
    for (const file of files) {
      try {
        if (!fs.existsSync(file)) {
          console.log(`⚠️ Arquivo não encontrado: ${file}`);
          continue;
        }
        
        totalFilesChecked++;
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar se já tem verificação de db nulo
        if (hasDbNullCheck(content)) {
          console.log(`✓ Arquivo ${file} já possui verificação de db nulo`);
          continue;
        }
        
        // Aplicar correção com base no tipo de arquivo
        let modifiedContent = content;
        
        if (file.includes('/api/') && file.endsWith('route.ts')) {
          // Para arquivos de API
          modifiedContent = addDbNullCheckToApiFile(content);
        } else if (file.includes('/services/')) {
          // Para arquivos de serviço
          modifiedContent = addDbNullCheckToServiceFile(content);
        } else {
          // Para componentes e outros tipos
          modifiedContent = addDbNullCheckToComponentFile(content);
        }
        
        if (modifiedContent !== content) {
          fs.writeFileSync(file, modifiedContent, 'utf8');
          console.log(`✅ Verificação de db nulo adicionada ao arquivo ${file}`);
          correctedFiles++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos adicionais:', error.message);
  }
  
  console.log(`\n✨ Processo concluído: ${correctedFiles} arquivos corrigidos de ${totalFilesChecked} verificados`);
}

// Executar a correção
fixFirebaseDb();

console.log('===== Correção de verificação do Firebase db concluída ====='); 