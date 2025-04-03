'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { alunoService } from '@/services/alunoService';
import { AlunoFormData, AlunoTipo } from '@/types/aluno';
import { useToast } from "@/components/ui/use-toast";

// Mapeamento de Dias da Semana (Texto -> Número)
const mapDiaSemana: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2, // Assumindo "terca" sem cedilha no CSV
  'terça': 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
  'sábado': 6
};

// Mapeamento de Planos (Texto CSV -> AlunoTipo)
const mapPlanoToTipo = (planoCsv: string): AlunoTipo => {
  const planoNorm = planoCsv.trim().toLowerCase();
  if (planoNorm.includes('integral 5')) return 'INTEGRAL_5X';
  if (planoNorm.includes('integral 4')) return 'INTEGRAL_4X';
  if (planoNorm.includes('integral 3')) return 'INTEGRAL_3X';
  if (planoNorm.includes('integral 2')) return 'INTEGRAL_2X';
  if (planoNorm.includes('mensalista')) return 'MENSALISTA';
  if (planoNorm.includes('avulso')) return 'AVULSO';
  if (planoNorm.includes('semi')) return 'SEMI_INTEGRAL';
  if (planoNorm.includes('estendido')) {
    // Mapear para o novo tipo ESTENDIDO
    return 'ESTENDIDO'; 
  }
  console.warn(`Plano desconhecido "${planoCsv}", usando MENSALISTA como padrão.`);
  return 'MENSALISTA'; // Fallback para qualquer outro caso
};

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

  const handleImportClick = () => {
    if (!file) {
      toast({ title: "Erro", description: "Selecione um arquivo primeiro.", variant: "destructive" });
      return;
    }
    processFileAndImport();
  };

  const processFileAndImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Ler e processar o arquivo CSV
      toast({ title: "Etapa 1/2", description: "Lendo e processando arquivo CSV..." });
      const content = await file.text();
      const lines = content.split(/\r\n|\n/).slice(1); // Pula cabeçalho e normaliza quebras de linha

      // Estrutura para agrupar dados por matrícula
      const alunosDataMap: Record<string, { nome: string; turma: string; plano: string; diasPermitidos: Set<number> }> = {};
      let errosLeitura = 0;
      // Voltar a usar split por VÍRGULA para o cabeçalho
      const header = content.split(/\r\n|\n/)[0].toLowerCase().split(',').map((h: string) => h.trim().replace(/"/g, ''));
      
      // Identificar índices das colunas dinamicamente
      const idxMatricula = header.findIndex((h: string) => h.includes('matricula') || h.includes('matrícula'));
      const idxNome = header.findIndex((h: string) => h.includes('aluno'));
      const idxTurma = header.findIndex((h: string) => h.includes('turma'));
      const idxPlano = header.findIndex((h: string) => h.includes('plano'));
      const idxDia = header.findIndex((h: string) => h.includes('dia')); // dia da semana
      const idxPodeComer = header.findIndex((h: string) => h.includes('pode')); // pode comer

      if ([idxMatricula, idxNome, idxTurma, idxPlano, idxDia, idxPodeComer].some((idx: number) => idx === -1)) {
        throw new Error("Cabeçalho do CSV inválido. Verifique se as colunas Matricula, Aluno, Turma, Plano, Dia da Semana, Pode Comer? estão presentes.");
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Voltar a usar split por VÍRGULA para as colunas
        const columns = line.split(',').map((s: string) => s.trim().replace(/"/g, ''));

        if (columns.length <= Math.max(idxMatricula, idxNome, idxTurma, idxPlano, idxDia, idxPodeComer)) {
            console.warn(`Linha ${i + 2} ignorada: número insuficiente de colunas.`);
            errosLeitura++;
            continue;
        }

        const matricula = columns[idxMatricula];
        const nome = columns[idxNome];
        const turma = columns[idxTurma];
        const planoCsv = columns[idxPlano];
        const diaSemanaCsv = columns[idxDia].toLowerCase();
        const podeComerCsv = columns[idxPodeComer].toLowerCase();

        if (!matricula || !nome || !turma || !planoCsv) {
          console.warn(`Linha ${i + 2} ignorada: Dados essenciais (Matricula, Nome, Turma, Plano) faltando.`);
          errosLeitura++;
          continue;
        }

        // Inicializa o registro do aluno se não existir
        if (!alunosDataMap[matricula]) {
          alunosDataMap[matricula] = { nome, turma, plano: planoCsv, diasPermitidos: new Set() };
        } else {
          // Se já existe, atualiza nome, turma e plano (pega o da última ocorrência no CSV)
          alunosDataMap[matricula].nome = nome;
          alunosDataMap[matricula].turma = turma;
          alunosDataMap[matricula].plano = planoCsv;
        }

        // Adiciona o dia se PodeComer for "sim"
        if (podeComerCsv === 'sim') {
          const diaNum = mapDiaSemana[diaSemanaCsv];
          if (diaNum !== undefined && diaNum >= 1 && diaNum <= 5) { // Considera apenas Seg(1) a Sex(5)
            alunosDataMap[matricula].diasPermitidos.add(diaNum);
          } else if (diaNum !== undefined) {
            console.warn(`Linha ${i + 2}: Dia '${columns[idxDia]}' (fora de Seg-Sex) ignorado para matrícula ${matricula}`);
          } else {
            console.warn(`Linha ${i + 2}: Dia da semana '${columns[idxDia]}' não reconhecido para matrícula ${matricula}`);
          }
        }
      }

      if (Object.keys(alunosDataMap).length === 0) {
        throw new Error("Nenhum dado de aluno válido encontrado no arquivo após processamento.");
      }

      console.log(`Processamento CSV concluído. ${Object.keys(alunosDataMap).length} alunos únicos encontrados. ${errosLeitura} linhas com erro.`);
      if (errosLeitura > 0) {
         toast({ 
             title: "Aviso na Leitura do CSV", 
             description: `${errosLeitura} linhas do CSV continham erros ou dados incompletos e foram ignoradas. Verifique o console para detalhes.`, 
             variant: "destructive" 
         });
      }
      
      // 2. Criar ou Atualizar os alunos (Era Etapa 3)
      toast({ title: "Etapa 2/2", description: "Importando/Atualizando alunos na base de dados..." });
      const alunosParaImportar: AlunoFormData[] = Object.entries(alunosDataMap).map(([matricula, data]) => ({
        matricula,
        nome: data.nome,
        turma: data.turma,
        tipo: mapPlanoToTipo(data.plano),
        email: '', // Email vazio conforme solicitado
        ativo: true,
        diasRefeicaoPermitidos: Array.from(data.diasPermitidos).sort((a: number, b: number) => a - b),
      }));

      let processadosComSucesso = 0;
      let errosImportacao = 0;

      // Loop para criar ou atualizar
      for (const aluno of alunosParaImportar) {
        try {
          // Usar criarOuAtualizarAluno que já faz a verificação
          await alunoService.criarOuAtualizarAluno(aluno); 
          processadosComSucesso++; 
        } catch (error) {
          console.error(`Erro ao importar/atualizar aluno com matrícula ${aluno.matricula}:`, error);
          errosImportacao++;
        }
      }

      // Ajustar mensagem final
      toast({
        title: 'Importação Concluída',
        description: `${processadosComSucesso} alunos processados (criados ou atualizados). ${errosImportacao} erros durante o processo. ${errosLeitura} erros na leitura do CSV.`,
        variant: errosImportacao > 0 || errosLeitura > 0 ? 'destructive' : 'default'
      });

      if (processadosComSucesso > 0) {
        router.push('/dashboard/alunos'); // Redirecionar para a lista após sucesso
        router.refresh(); 
      }

    } catch (error: any) {
      console.error('Erro geral durante o processo de importação/atualização:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      toast({
        title: 'Erro Crítico na Importação',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Importar / Atualizar Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Selecione um arquivo CSV para importar novos alunos ou atualizar informações de alunos existentes com base na matrícula.
              </p>
              <p className="text-lg text-gray-700">
                O arquivo CSV deve ter as seguintes colunas (na ordem ou com cabeçalho correspondente):
              </p>
              <code className="text-lg bg-gray-100 p-4 rounded block font-mono">
                Matricula, Aluno, Turma, Plano, Dia da Semana, Pode Comer?
              </code>
              <div className="text-lg text-gray-700 space-y-3">
                <p className="font-semibold mt-2">Estrutura Esperada:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Matricula:</strong> Identificador único do aluno (será usado para atualizar).</li>
                  <li><strong>Aluno:</strong> Nome completo do aluno.</li>
                  <li><strong>Turma:</strong> Turma do aluno.</li>
                  <li><strong>Plano:</strong> Tipo de plano (Integral 5x, Integral 4x, Integral 3x, Integral 2x, Mensalista, Avulso, Semi Integral, Estendido).</li>
                  <li><strong>Dia da Semana:</strong> Segunda, Terca, Terça, Quarta, Quinta, Sexta.</li>
                  <li><strong>Pode Comer?:</strong> "Sim" para permitir refeição no dia da semana correspondente.</li>
                  <li>Apenas dias de Segunda a Sexta com "Sim" serão considerados para os dias permitidos.</li>
                  <li>Se um aluno (matrícula) aparecer múltiplas vezes, os dados de Nome, Turma e Plano da última linha serão usados, e os dias permitidos serão combinados.</li>
                </ul>
              </div>
            </div>
            
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="file" className="text-lg">Arquivo CSV</Label>
              <Input id="file" type="file" accept=".csv" onChange={handleFileChange} className="text-base" />
            </div>
            
            <Button onClick={handleImportClick} disabled={!file || loading} className="w-full text-lg py-3">
              {loading ? 'Processando...' : 'Importar / Atualizar Alunos'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
