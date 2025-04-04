export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  email?: string;
  tipo: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO';
  turma: string;
  ativo: boolean;
  diasRefeicaoPermitidos?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlunoFilter {
  nome?: string;
  matricula?: string;
  tipo?: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO' | 'SEMI_INTEGRAL' | 'ESTENDIDO';
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