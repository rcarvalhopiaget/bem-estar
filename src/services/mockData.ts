// Dados simulados para uso no dashboard enquanto não temos conexão com o banco

export interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  proximaConsulta?: string;
  ultimaConsulta?: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

export interface Consulta {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  data: string;
  horario: string;
  status: 'agendada' | 'concluida' | 'cancelada';
  tipo: string;
  observacao?: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
}

// Pacientes simulados
export const mockPacientes: Paciente[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    email: 'maria.silva@example.com',
    telefone: '(11) 98765-4321',
    dataNascimento: '1985-05-15',
    proximaConsulta: '2024-03-25',
    ultimaConsulta: '2024-02-10',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao.santos@example.com',
    telefone: '(11) 91234-5678',
    dataNascimento: '1992-08-22',
    proximaConsulta: '2024-03-30',
    ultimaConsulta: '2024-03-02',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Ana Oliveira',
    email: 'ana.oliveira@example.com',
    telefone: '(11) 99876-5432',
    dataNascimento: '1978-12-03',
    status: 'pendente'
  },
  {
    id: '4',
    nome: 'Carlos Pereira',
    email: 'carlos.pereira@example.com',
    telefone: '(11) 98888-7777',
    dataNascimento: '1990-03-27',
    proximaConsulta: '2024-04-05',
    ultimaConsulta: '2024-01-15',
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'Mariana Costa',
    email: 'mariana.costa@example.com',
    telefone: '(11) 97777-8888',
    dataNascimento: '1982-09-10',
    status: 'inativo'
  }
];

// Consultas simuladas
export const mockConsultas: Consulta[] = [
  {
    id: '1',
    pacienteId: '1',
    pacienteNome: 'Maria Silva',
    data: '2024-03-25',
    horario: '09:00',
    status: 'agendada',
    tipo: 'Avaliação',
    observacao: 'Primeira consulta do mês'
  },
  {
    id: '2',
    pacienteId: '2',
    pacienteNome: 'João Santos',
    data: '2024-03-30',
    horario: '14:30',
    status: 'agendada',
    tipo: 'Retorno'
  },
  {
    id: '3',
    pacienteId: '4',
    pacienteNome: 'Carlos Pereira',
    data: '2024-04-05',
    horario: '10:15',
    status: 'agendada',
    tipo: 'Avaliação'
  },
  {
    id: '4',
    pacienteId: '1',
    pacienteNome: 'Maria Silva',
    data: '2024-02-10',
    horario: '11:00',
    status: 'concluida',
    tipo: 'Avaliação',
    observacao: 'Paciente relatou melhora nos sintomas'
  },
  {
    id: '5',
    pacienteId: '2',
    pacienteNome: 'João Santos',
    data: '2024-03-02',
    horario: '16:45',
    status: 'concluida',
    tipo: 'Retorno'
  },
  {
    id: '6',
    pacienteId: '5',
    pacienteNome: 'Mariana Costa',
    data: '2024-03-18',
    horario: '13:30',
    status: 'cancelada',
    tipo: 'Avaliação',
    observacao: 'Cancelado pelo paciente'
  }
];

// Profissionais simulados
export const mockProfissionais: Profissional[] = [
  {
    id: '1',
    nome: 'Dr. Roberto Almeida',
    especialidade: 'Clínico Geral',
    email: 'roberto.almeida@example.com',
    telefone: '(11) 95555-1111',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Dra. Cristina Lima',
    especialidade: 'Nutricionista',
    email: 'cristina.lima@example.com',
    telefone: '(11) 94444-2222',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Dr. Lucas Mendes',
    especialidade: 'Fisioterapeuta',
    email: 'lucas.mendes@example.com',
    telefone: '(11) 93333-4444',
    status: 'ativo'
  },
  {
    id: '4',
    nome: 'Dra. Patrícia Sousa',
    especialidade: 'Psicóloga',
    email: 'patricia.sousa@example.com',
    telefone: '(11) 92222-5555',
    status: 'inativo'
  }
];

// Função para obter pacientes
export const getPacientes = (): Promise<Paciente[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPacientes);
    }, 500);
  });
};

// Função para obter consultas
export const getConsultas = (): Promise<Consulta[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockConsultas);
    }, 500);
  });
};

// Função para obter próximas consultas (filtra apenas as agendadas futuras)
export const getProximasConsultas = (): Promise<Consulta[]> => {
  return new Promise((resolve) => {
    const hoje = new Date().toISOString().split('T')[0];
    const proximas = mockConsultas.filter(
      consulta => consulta.status === 'agendada' && consulta.data >= hoje
    );
    
    setTimeout(() => {
      resolve(proximas);
    }, 500);
  });
};

// Função para obter profissionais
export const getProfissionais = (): Promise<Profissional[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockProfissionais);
    }, 500);
  });
}; 