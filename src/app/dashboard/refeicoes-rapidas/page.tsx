'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RefeicaoRapida from '@/components/refeicoes/RefeicaoRapida';
import { EmailVerification } from '@/components/EmailVerification';
import { alunoService } from '@/services/alunoService';
import { Aluno } from '@/types/aluno';
import { useToast } from "@/components/ui/use-toast";

export default function RefeicoesRapidasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataAtual, setDataAtual] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Atualiza a data atual a cada minuto para garantir que estamos sempre com a data correta
  useEffect(() => {
    const intervalo = setInterval(() => {
      setDataAtual(new Date());
    }, 60000); // 60000 ms = 1 minuto

    return () => clearInterval(intervalo);
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carregamento de alunos ativos...');
      const alunosData = await alunoService.listarAlunos({ ativo: true });
      console.log('Alunos carregados com sucesso:', alunosData.length);
      
      // Log para inspecionar os primeiros alunos
      if (alunosData.length > 0) {
        console.log('Amostra do primeiro aluno:', JSON.stringify(alunosData[0]));
      }
      
      setAlunos(alunosData);
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de alunos.",
      });
      setError('Erro ao carregar lista de alunos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAlunos();
  }, []);

  const handleRefeicaoMarcada = () => {
    // Correção: Forçar a atualização da data para disparar
    // o useEffect de recarga no componente filho (RefeicaoRapida)
    setDataAtual(new Date()); 
    // Opcionalmente, poderia chamar carregarAlunos TAMBÉM, 
    // mas a atualização da data é o gatilho principal para RefeicaoRapida.
    // carregarAlunos();
    toast({ title: "Info", description: "Atualizando dados..." }); // Feedback opcional
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Refeições Rápidas</h1>
        <RefeicaoRapida 
          alunos={alunos} 
          data={dataAtual}
          onRefeicaoMarcada={handleRefeicaoMarcada} 
        />
      </div>
    </div>
  );
}
