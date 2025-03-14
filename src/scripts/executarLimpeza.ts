import limparAlunosDuplicados from './limparAlunosDuplicados';

async function main() {
  try {
    console.log('Iniciando processo de limpeza de alunos duplicados...\n');
    
    // Executar limpeza
    await limparAlunosDuplicados();
    
    console.log('\nProcesso finalizado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\nErro durante o processo:', error);
    process.exit(1);
  }
}

main();
