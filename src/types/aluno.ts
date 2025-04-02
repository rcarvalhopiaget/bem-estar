export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  email: string;
  tipo: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO';
  turma: string;
  ativo: boolean;
  diasRefeicaoPermitidos?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type AlunoFormData = Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>;

export interface AlunoFilter {
  nome?: string;
  matricula?: string;
  tipo?: 'MENSALISTA' | 'INTEGRAL_5X' | 'INTEGRAL_4X' | 'INTEGRAL_3X' | 'INTEGRAL_2X' | 'AVULSO';
  turma?: string;
  ativo?: boolean;
}