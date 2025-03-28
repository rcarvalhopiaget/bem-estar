const fs = require('fs');
const path = require('path');

const files = [
  'src/app/configuracoes/relatorios/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /from ['"]@\/components\/ui\/Separator['"]/g,
    'from \'@/components/ui/separator\''
  );
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}); 