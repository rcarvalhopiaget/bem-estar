const fs = require('fs');
const path = require('path');

const uiComponentsDir = path.join(__dirname, 'src', 'components', 'ui');

// Lista todos os arquivos no diretório de componentes UI
fs.readdir(uiComponentsDir, (err, files) => {
  if (err) {
    console.error('Erro ao ler o diretório:', err);
    return;
  }

  files.forEach(file => {
    const filePath = path.join(uiComponentsDir, file);
    const fileExt = path.extname(file);
    const fileName = path.basename(file, fileExt);
    
    // Verifica se o nome do arquivo começa com letra maiúscula
    if (fileName[0] === fileName[0].toUpperCase() && fileName[0] !== fileName[0].toLowerCase()) {
      // Cria o novo nome do arquivo com a primeira letra minúscula
      const newFileName = fileName[0].toLowerCase() + fileName.slice(1) + fileExt;
      const newFilePath = path.join(uiComponentsDir, newFileName);
      
      // Renomeia o arquivo
      fs.rename(filePath, newFilePath, err => {
        if (err) {
          console.error(`Erro ao renomear ${file}:`, err);
        } else {
          console.log(`Arquivo renomeado: ${file} -> ${newFileName}`);
        }
      });
    }
  });
}); 