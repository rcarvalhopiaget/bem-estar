const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Encontrar todos os arquivos TypeScript/TSX no projeto
exec('dir /s /b *.tsx *.ts', { cwd: path.join(__dirname, 'src') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao listar arquivos: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Erro na execução: ${stderr}`);
    return;
  }
  
  const files = stdout.split('\n').filter(file => file.trim());
  
  files.forEach(file => {
    if (!file) return;
    
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        console.error(`Erro ao ler arquivo ${file}: ${err.message}`);
        return;
      }
      
      // Verifica importações de componentes UI com Toaster com T maiúsculo
      const updatedContent = data.replace(
        /from ['"]@\/components\/ui\/Toaster['"]/g, 
        'from \'@/components/ui/toaster\''
      );
      
      if (data !== updatedContent) {
        fs.writeFile(file, updatedContent, 'utf8', (err) => {
          if (err) {
            console.error(`Erro ao escrever no arquivo ${file}: ${err.message}`);
            return;
          }
          console.log(`Importações corrigidas em: ${file}`);
        });
      }
    });
  });
}); 