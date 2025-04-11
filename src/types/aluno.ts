export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  email?: string;
  tipo: 'MENSALISTA' | 'MENSALISTA_GRATUIDADE' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'INTEGRAL_1X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO' | 'ESTENDIDO_5X' | 'ESTENDIDO_4X' | 'ESTENDIDO_3X' | 'ESTENDIDO_2X' | 'ESTENDIDO_1X';
  turma: string;
  ativo: boolean;
  diasRefeicaoPermitidos?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlunoFilter {
  nome?: string;
  matricula?: string;
  tipo?: 'MENSALISTA' | 'MENSALISTA_GRATUIDADE' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'INTEGRAL_1X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO' | 'ESTENDIDO_5X' | 'ESTENDIDO_4X' | 'ESTENDIDO_3X' | 'ESTENDIDO_2X' | 'ESTENDIDO_1X';
  turma?: string;
  ativo?: boolean;
}

export type AlunoTipo = Aluno['tipo'];

export interface AlunoFormData {
  nome: string;
  matricula: string;
  email?: string;
  tipo: AlunoTipo;
  turma: string;
  ativo: boolean;
  diasRefeicaoPermitidos?: number[];
}