const { execSync } = require('child_process');
const fs = require('fs');

// Instalar dependências adicionais necessárias para o build na Vercel
console.log('📦 Instalando dependências adicionais para o build...');
try {
  execSync('npm install critters', { stdio: 'inherit' });
  console.log('✅ critters instalado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências adicionais:', error);
}

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

// Executar o build do Next.js
console.log('🔨 Executando build do Next.js...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o build:', error);
  process.exit(1);
} 