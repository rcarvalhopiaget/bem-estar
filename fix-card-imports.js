const fs = require('fs');
const path = require('path');

const files = [
  'src/app/admin-restaurante/page.tsx',
  'src/app/configuracoes/relatorios/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/admin/atualizar-usuario-restaurante/page.tsx',
  'src/app/dashboard/admin/verificar-usuarios/page.tsx',
  'src/app/dashboard/alunos/importar/page.tsx',
  'src/app/dashboard/restaurante/page.tsx',
  'src/app/dashboard/teste-notificacoes/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /from ['"]@\/components\/ui\/card['"]/g,
    'from \'@/components/ui/Card\''
  );
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}); 