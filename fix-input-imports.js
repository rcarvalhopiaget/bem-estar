const fs = require('fs');
const path = require('path');

const files = [
  'src/app/configuracoes/relatorios/page.tsx',
  'src/components/alunos/AlunoForm.tsx',
  'src/app/dashboard/alunos/importar/page.tsx',
  'src/app/dashboard/relatorios/page.tsx',
  'src/app/dashboard/restaurante/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /from ['"]@\/components\/ui\/input['"]/g,
    'from \'@/components/ui/Input\''
  );
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}); 