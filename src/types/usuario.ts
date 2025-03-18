export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum PerfilUsuario {
  ADMIN = 'ADMIN',
  COORDENADOR = 'COORDENADOR',
  PROFESSOR = 'PROFESSOR',
  OPERADOR = 'OPERADOR'
}

export const PERFIS_USUARIO = {
  ADMIN: {
    valor: PerfilUsuario.ADMIN,
    descricao: 'Administrador',
    permissoes: [
      'gerenciar_usuarios',
      'gerenciar_alunos',
      'gerenciar_refeicoes',
      'visualizar_relatorios'
    ]
  },
  COORDENADOR: {
    valor: PerfilUsuario.COORDENADOR,
    descricao: 'Coordenador',
    permissoes: [
      'gerenciar_alunos',
      'gerenciar_refeicoes',
      'visualizar_relatorios'
    ]
  },
  PROFESSOR: {
    valor: PerfilUsuario.PROFESSOR,
    descricao: 'Professor',
    permissoes: [
      'gerenciar_refeicoes',
      'visualizar_relatorios'
    ]
  },
  OPERADOR: {
    valor: PerfilUsuario.OPERADOR,
    descricao: 'Operador',
    permissoes: [
      'gerenciar_refeicoes'
    ]
  }
};
