import { Refeicao } from './refeicao';

export type TipoRefeicao = Refeicao['tipo'];

export interface RelatorioFiltro {
  dataInicio?: Date;
  dataFim?: Date;
  alunoId?: string;
  turma?: string;
  tipo?: TipoRefeicao;
}

export type TipoNotificacao = 'erro' | 'aviso';

export interface NotificacaoConfig {
  tipo: TipoNotificacao;
  mensagem: string;
}

export interface ConfiguracaoRelatorio {
  email: string;
  horario: string; // HH:mm
  turmas?: string[];
  ativo: boolean;
}
