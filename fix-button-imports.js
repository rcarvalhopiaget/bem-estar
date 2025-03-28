const fs = require('fs');
const path = require('path');

const files = [
  'src/components/EmailVerification.tsx',
  'src/components/refeicoes/RefeicaoManager.tsx',
  'src/components/refeicoes/RefeicaoForm.tsx',
  'src/components/alunos/AlunoForm.tsx',
  'src/components/alunos/ImportarAlunos.tsx',
  'src/app/dashboard/restaurante/page.tsx',
  'src/app/dashboard/teste-notificacoes/page.tsx',
  'src/app/dashboard/relatorios/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/alunos/page.tsx',
  'src/app/dashboard/alunos/importar/page.tsx',
  'src/app/dashboard/admin/page.tsx',
  'src/app/dashboard/admin/verificar-usuarios/page.tsx',
  'src/app/dashboard/admin/atualizar-usuario-restaurante/page.tsx',
  'src/app/configuracoes/relatorios/page.tsx',
  'src/app/admin-restaurante/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /from ['"]@\/components\/ui\/button['"]/g,
    'from \'@/components/ui/Button\''
  );
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}); 