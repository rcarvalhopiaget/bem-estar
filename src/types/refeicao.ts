export type TipoRefeicao = 'ALMOCO' | 'LANCHE_MANHA' | 'LANCHE_TARDE' | 'SOPA';

export interface Refeicao {
  id: string;
  alunoId: string;
  nomeAluno: string;
  turma: string;
  data: Date;
  tipo: TipoRefeicao;
  presente: boolean;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefeicaoFormData {
  alunoId: string;
  nomeAluno: string;
  turma: string;
  data: Date;
  tipo: TipoRefeicao;
  presente: boolean;
  observacao?: string;
}

export interface RefeicaoFilter {
  data?: Date;
  dataInicio?: Date;
  dataFim?: Date;
  turma?: string;
  tipo?: TipoRefeicao;
  alunoId?: string;
  presente?: boolean;
}

export const TIPOS_REFEICAO: Record<TipoRefeicao, string> = {
  'ALMOCO': 'Almoço',
  'LANCHE_MANHA': 'Lanche da Manhã',
  'LANCHE_TARDE': 'Lanche da Tarde',
  'SOPA': 'Sopa'
};