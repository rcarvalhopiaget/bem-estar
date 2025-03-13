import { Refeicao } from './refeicao';

export interface RelatorioFiltro {
  dataInicio?: Date;
  dataFim?: Date;
  alunoId?: string;
  turma?: string;
  tipo?: Refeicao['tipo'];
}

export interface NotificacaoConfig {
  email: string;
  tipo: 'DIARIO' | 'SEMANAL' | 'MENSAL';
  horario: string; // HH:mm
  turmas?: string[];
  ativo: boolean;
}
