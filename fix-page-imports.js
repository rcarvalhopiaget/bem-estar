const fs = require('fs');
const path = require('path');

console.log('=== Corrigindo importações nas páginas problemáticas ===');

// Lista de arquivos e componentes com problemas
const problematicFiles = [
  {
    path: 'src/app/admin-restaurante/page.tsx',
    components: ['button', 'card']
  },
  {
    path: 'src/app/configuracoes/relatorios/page.tsx',
    components: ['button', 'input', 'card', 'switch']
  }
];

// Função para unificar importações do mesmo módulo
function mergeReactImports(imports) {
  // Mapeamento de importações por módulo
  const moduleImports = {};
  
  // Expressão regular para extrair nome do módulo e itens importados
  const importRegex = /import\s+(?:{([^}]*)})?\s*from\s+['"]([^'"]*)['"]/;
  
  // Processar cada importação
  imports.forEach(importStatement => {
    const match = importStatement.match(importRegex);
    if (match) {
      const items = match[1] ? match[1].split(',').map(item => item.trim()) : [];
      const moduleName = match[2];
      
      // Inicializar array para este módulo se ainda não existir
      if (!moduleImports[moduleName]) {
        moduleImports[moduleName] = new Set();
      }
      
      // Adicionar todos os itens importados
      items.forEach(item => {
        if (item) moduleImports[moduleName].add(item);
      });
    }
  });
  
  // Gerar novas declarações de importação unificadas
  const mergedImports = [];
  for (const [module, items] of Object.entries(moduleImports)) {
    if (items.size > 0) {
      // Ordenar os itens importados para consistência
      const sortedItems = Array.from(items).sort();
      mergedImports.push(`import { ${sortedItems.join(', ')} } from '${module}'`);
    } else {
      // Para importações que não usam chaves, como "import React from 'react'"
      mergedImports.push(`import '${module}'`);
    }
  }
  
  return mergedImports;
}

// Função para corrigir os arquivos
function fixPageImports() {
  problematicFiles.forEach(({ path: filePath, components }) => {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      return;
    }
    
    // Ler o conteúdo original do arquivo
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Extrair apenas o componente principal de página (após todos os componentes embutidos)
    const pageComponentMatch = content.match(/(export\s+default\s+function\s+\w+\(\)\s*{[\s\S]*$)/);
    if (!pageComponentMatch) {
      console.log(`⚠️ Não foi possível encontrar o componente principal em: ${filePath}`);
      return;
    }
    
    const pageComponent = pageComponentMatch[1];
    
    // Extrair todas as importações que não são dos componentes UI
    const importLines = [];
    const reactImports = [];
    const utilsImports = [];
    const otherImports = [];
    
    const importRegex = /import\s+.*?from\s+['"]([^'"]*)['"]/g;
    let importMatch;
    
    while ((importMatch = importRegex.exec(content)) !== null) {
      const importSource = importMatch[1];
      const importStatement = importMatch[0];
      
      // Separar importações por tipo
      if (importSource.includes('@/components/ui/')) {
        // Ignorar importações de componentes UI
        continue;
      } else if (importSource === 'react' || importSource === 'react-dom') {
        reactImports.push(importStatement);
      } else if (importSource.includes('@/lib/utils')) {
        utilsImports.push(importStatement);
      } else {
        otherImports.push(importStatement);
      }
    }
    
    // Reconstruir o arquivo do zero
    let newContent = "'use client';\n\n";
    
    // Adicionar as importações corretas dos componentes UI
    components.forEach(component => {
      if (component === 'card') {
        newContent += `import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/${component}';\n`;
      } else if (component === 'switch') {
        newContent += `import { Switch } from '@/components/ui/${component}';\n`;
      } else {
        const componentName = component.charAt(0).toUpperCase() + component.slice(1);
        newContent += `import { ${componentName} } from '@/components/ui/${component}';\n`;
      }
    });
    
    // Unificar e adicionar as importações do React
    if (reactImports.length > 0) {
      const mergedReactImports = ['import { useState, forwardRef } from \'react\''];
      mergedReactImports.forEach(importLine => {
        newContent += importLine + ';\n';
      });
    }
    
    // Unificar e adicionar as importações do utils
    if (utilsImports.length > 0) {
      newContent += 'import { cn } from \'@/lib/utils\';\n';
    }
    
    // Adicionar outras importações
    otherImports.forEach(importLine => {
      newContent += importLine + ';\n';
    });
    
    // Adicionar o componente principal
    newContent += '\n' + pageComponent;
    
    // Salvar as alterações
    fs.writeFileSync(fullPath, newContent, 'utf8');
    
    console.log(`✅ Importações corrigidas em: ${filePath}`);
  });
}

// Executar função principal
try {
  fixPageImports();
  console.log('\n=== Páginas corrigidas com sucesso! ===');
  console.log('As importações dos componentes UI foram padronizadas');
} catch (error) {
  console.error('\n❌ Erro ao corrigir importações nas páginas:', error);
} 