'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AtividadesRecentes } from '@/components/atividades/AtividadesRecentes';
import { usePermissions } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';
import { getPacientes, getConsultas, getProximasConsultas, mockPacientes, mockConsultas, Paciente, Consulta } from '@/services/mockData';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const { perfil, isOperador, isProfessor, isCoordenador, isAdmin } = usePermissions();
  const [isRestauranteUser, setIsRestauranteUser] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [proximasConsultas, setProximasConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Perfil do usuário:', perfil);
    console.log('userData:', userData);
    console.log('É operador?', isOperador);
    console.log('É administrador?', isAdmin);
    console.log('Email do usuário:', user?.email);
    
    // Verificar se o email do usuário é de administrador
    if (user?.email && (
      user.email === 'admin@bemestar.com' || 
      user.email === 'teste@teste.com' || 
      user.email === 'rodrigo.carvalho@jpiaget.com.br'
    )) {
      setIsAdminUser(true);
      console.log('É administrador por email!');
    }
    
    // Verificar se o email do usuário contém "restaurante"
    if (user?.email && user.email.includes('restaurante')) {
      setIsRestauranteUser(true);
      console.log('É usuário do restaurante!');
    }

    const carregarDados = async () => {
      try {
        const [pacientesData, consultasData, proximasConsultasData] = await Promise.all([
          getPacientes(),
          getConsultas(),
          getProximasConsultas()
        ]);
        
        setPacientes(pacientesData);
        setConsultas(consultasData);
        setProximasConsultas(proximasConsultasData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [perfil, userData, isOperador, isAdmin, user]);

  const pacientesAtivos = mockPacientes.filter(p => p.status === 'ativo').length;
  const consultasAgendadas = mockConsultas.filter(c => c.status === 'agendada').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Bem-vindo ao Sistema BemEstar!
      </h1>
      
      <p className="text-muted-foreground">
        Este é um dashboard com dados simulados para demonstração.
      </p>

      {/* Cards com estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Ativos
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientesAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes com status ativo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consultas Agendadas
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasAgendadas}</div>
            <p className="text-xs text-muted-foreground">
              Consultas futuras agendadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPacientes.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de pacientes cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consultas Realizadas
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConsultas.filter(c => c.status === 'concluida').length}</div>
            <p className="text-xs text-muted-foreground">
              Consultas já realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de próximas consultas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Próximas Consultas</h2>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Paciente</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Data</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Horário</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">Carregando...</td>
                  </tr>
                ) : proximasConsultas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">Nenhuma consulta agendada</td>
                  </tr>
                ) : (
                  proximasConsultas.map((consulta) => (
                    <tr key={consulta.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">{consulta.pacienteNome}</td>
                      <td className="p-4 align-middle">{new Date(consulta.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 align-middle">{consulta.horario}</td>
                      <td className="p-4 align-middle">{consulta.tipo}</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Ver detalhes</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Links para diferentes seções */}
      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gerenciar Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/pacientes">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gerenciar Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/consultas">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}