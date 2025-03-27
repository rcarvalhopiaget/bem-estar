'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { alunoService } from '@/services/alunoService';
import { AlunoFormData } from '@/types/aluno';
import { useToast, toast } from '@/components/ui/toast-wrapper';

export default function ImportarAlunosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo para importar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const content = await file.text();
      const lines = content.split('\n');
      const alunos: AlunoFormData[] = [];
      let erros = 0;
      let atualizados = 0;
      let novos = 0;

      // Pula o cabeçalho
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [matricula, nome, email, tipo, turma] = line.split(',').map(s => s.trim());
        
        if (!matricula || !nome || !tipo || !turma) {
          console.error(`Linha ${i + 1} inválida:`, line);
          erros++;
          continue;
        }

        // Verifica se o tipo é válido
        const tiposValidos = ['INTEGRAL_5X', 'INTEGRAL_4X', 'INTEGRAL_3X', 'INTEGRAL_2X', 'MENSALISTA'];
        if (!tiposValidos.includes(tipo)) {
          console.error(`Linha ${i + 1} com tipo inválido:`, tipo);
          erros++;
          continue;
        }

        alunos.push({
          matricula,
          nome,
          email: email || `${matricula}@email.com`,
          tipo: tipo as any,
          turma,
          ativo: true
        });
      }

      console.log(`Processando ${alunos.length} alunos...`);
      
      // Importa os alunos em paralelo
      const resultados = await Promise.all(
        alunos.map(async aluno => {
          try {
            const alunoExistente = await alunoService.buscarAlunoPorMatricula(aluno.matricula);
            if (alunoExistente) {
              atualizados++;
            } else {
              novos++;
            }
            return await alunoService.criarOuAtualizarAluno(aluno);
          } catch (error) {
            console.error('Erro ao importar aluno:', aluno, error);
            erros++;
            return null;
          }
        })
      );

      const sucessos = resultados.filter(r => r !== null).length;

      toast({
        title: 'Importação concluída',
        description: `${novos} novos alunos, ${atualizados} atualizados. ${erros} erros encontrados.`,
        variant: erros > 0 ? 'destructive' : 'default',
      });

      if (sucessos > 0) {
        router.refresh();
        router.push('/dashboard/refeicoes-rapidas');
      }
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar o arquivo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Importar Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Selecione um arquivo CSV com os seguintes campos:
              </p>
              <code className="text-lg bg-gray-100 p-4 rounded block font-mono">
                matrícula, nome, email, tipo, turma
              </code>
              <div className="text-lg text-gray-700 space-y-3">
                <p className="font-semibold">Tipos de aluno e cotas semanais:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>INTEGRAL_5X: 5 refeições/semana</li>
                  <li>INTEGRAL_4X: 4 refeições/semana</li>
                  <li>INTEGRAL_3X: 3 refeições/semana</li>
                  <li>INTEGRAL_2X: 2 refeições/semana</li>
                  <li>MENSALISTA: sem limite</li>
                </ul>
              </div>
            </div>
            
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="file" className="text-lg">Arquivo CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                className="text-lg p-6 h-auto cursor-pointer touch-manipulation"
              />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleImport}
                disabled={!file || loading}
                className="w-40 h-14 text-lg touch-manipulation"
              >
                {loading ? 'Importando...' : 'Importar'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-32 h-14 text-lg touch-manipulation"
              >
                Voltar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
