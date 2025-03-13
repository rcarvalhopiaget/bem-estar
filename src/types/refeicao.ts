export interface Refeicao {
  id: string;
  alunoId: string;
  nomeAluno: string;
  turma: string;
  data: Date;
  tipo: 'ALMOCO' | 'LANCHE_MANHA' | 'LANCHE_TARDE';
  presente: boolean;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefeicaoFormData = Omit<Refeicao, 'id' | 'createdAt' | 'updatedAt'>;

export interface RefeicaoFilter {
  dataInicio?: Date;
  dataFim?: Date;
  turma?: string;
  tipo?: Refeicao['tipo'];
  alunoId?: string;
  presente?: boolean;
}

export const TIPOS_REFEICAO = {
  ALMOCO: 'Almoço',
  LANCHE_MANHA: 'Lanche da Manhã',
  LANCHE_TARDE: 'Lanche da Tarde'
} as const; 