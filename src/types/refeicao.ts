import { AlunoTipo } from './aluno'

export type TipoRefeicao = 'ALMOCO' | 'LANCHE_MANHA' | 'LANCHE_TARDE' | 'SOPA';

export interface Refeicao {
  id: string;
  alunoId: string;
  nomeAluno: string;
  turma: string;
  data: Date;
  tipo: TipoRefeicao;
  tipoConsumo?: AlunoTipo;
  presente: boolean;
  observacao?: string;
  isAvulso?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefeicaoFormData {
  alunoId: string;
  nomeAluno: string;
  turma: string;
  data: Date;
  tipo: TipoRefeicao;
  tipoConsumo: AlunoTipo;
  presente: boolean;
  observacao?: string;
  isAvulso?: boolean;
}

export interface RefeicaoFilter {
  data?: Date;
  dataInicio?: Date;
  dataFim?: Date;
  turma?: string;
  tipo?: TipoRefeicao;
  tipoConsumo?: AlunoTipo;
  alunoId?: string;
  presente?: boolean;
}

export const TIPOS_REFEICAO: Record<TipoRefeicao, string> = {
  'ALMOCO': 'Almoço',
  'LANCHE_MANHA': 'Lanche da Manhã',
  'LANCHE_TARDE': 'Lanche da Tarde',
  'SOPA': 'Sopa'
};