import { AlunoFormData } from "@/types/aluno";

const mapTipoIntegral = (opcao: string): 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' => {
  const opcaoUpperCase = opcao.toUpperCase().trim();
  
  // Mapeamento específico para os tipos do formulário
  if (opcaoUpperCase.includes('SEMI INTEGRAL')) return 'INTEGRAL_5X';
  if (opcaoUpperCase.includes('5 X SEMANA')) return 'INTEGRAL_5X';
  if (opcaoUpperCase.includes('4 X SEMANA')) return 'INTEGRAL_4X';
  if (opcaoUpperCase.includes('3 X SEMANA')) return 'INTEGRAL_3X';
  if (opcaoUpperCase.includes('2 X SEMANA')) return 'INTEGRAL_2X';
  
  return 'MENSALISTA';
};

const limparTexto = (texto: string): string => {
  return texto
    .trim()
    .replace(/^["']|["']$/g, '') // Remove aspas no início e fim
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .replace(/[\r\n]/g, ''); // Remove quebras de linha
};

// Função auxiliar para parsear linha CSV considerando campos com aspas
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && line[i + 1] === '"') {
      // Aspas duplas escapadas
      current += '"';
      i++;
    } else if (char === '"') {
      // Toggle estado das aspas
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Separador encontrado fora das aspas
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Adiciona o último campo
  result.push(current);
  
  return result.map(limparTexto);
};

export const parseCsvToAlunos = (csvContent: string): AlunoFormData[] => {
  try {
    // Normaliza as quebras de linha
    const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Divide o conteúdo em linhas
    const lines = normalizedContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('Número de linhas encontradas:', lines.length);

    // Remove o cabeçalho
    const dataLines = lines.slice(1);
    console.log('Número de linhas de dados:', dataLines.length);

    const alunos: AlunoFormData[] = [];

    for (const line of dataLines) {
      // Parseia a linha CSV
      const columns = parseCSVLine(line);
      console.log('Colunas encontradas:', columns.length);
      
      // Verifica se tem colunas suficientes
      if (columns.length < 6) {
        console.log('Linha ignorada - colunas insuficientes:', columns);
        continue;
      }

      const [
        timestamp,    // Coluna 0: Data/hora
        email,       // Coluna 1: Email
        nomeAluno,   // Coluna 2: Nome do aluno
        turma,       // Coluna 3: Turma
        contratante, // Coluna 4: Nome do contratante
        tipoIntegral // Coluna 5: Opção desejada
      ] = columns;

      if (!email || !nomeAluno || !turma) {
        console.log('Linha ignorada - dados essenciais faltando:', { email, nomeAluno, turma });
        continue;
      }

      // Gera uma matrícula única baseada no nome e timestamp
      const timestampLimpo = timestamp.replace(/[^\d]/g, '');
      const matricula = nomeAluno
        .split(' ')
        .map(palavra => palavra[0])
        .join('')
        .toUpperCase() + 
        timestampLimpo.slice(-4);

      const aluno: AlunoFormData = {
        nome: nomeAluno,
        matricula,
        email,
        tipo: mapTipoIntegral(tipoIntegral),
        turma,
        ativo: true,
      };

      console.log('Aluno processado:', aluno);
      alunos.push(aluno);
    }

    console.log('Total de alunos processados:', alunos.length);
    
    if (alunos.length === 0) {
      throw new Error('Nenhum aluno encontrado no arquivo. Verifique se o formato está correto.');
    }

    return alunos;
  } catch (error) {
    console.error('Erro ao processar CSV:', error);
    throw new Error(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}; 