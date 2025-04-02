export interface Atividade {
  id: string;
  tipo: 'REFEICAO' | 'ALUNO' | 'SISTEMA';
  descricao: string;
  usuarioId: string;
  usuarioEmail: string;
  entidadeId?: string;
  entidadeTipo?: string;
  detalhes?: Record<string, any>;
  createdAt: Date;
}

export type AtividadeFormData = Omit<Atividade, 'id' | 'createdAt'>;

export interface AtividadeFilter {
  tipo?: 'REFEICAO' | 'ALUNO' | 'SISTEMA';
  usuarioId?: string;
  limite?: number;
}
