"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salvarOuAtualizar, getPorData, getUltimos30Dias } from "@/services/refeicaoPorKiloService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RefeicaoPorKilo } from "@/types/refeicao-por-kilo";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const schema = z.object({
  data: z.string().min(10, "Data obrigatória"),
  quantidade: z.coerce.number().int().min(0, "Quantidade deve ser zero ou maior"),
});

type FormData = z.infer<typeof schema>;

export default function RefeicoesPorKiloPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [historicoLancamentos, setHistoricoLancamentos] = useState<RefeicaoPorKilo[]>([]);
  const [isHistoricoLoading, setIsHistoricoLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      quantidade: 0,
    },
  });

  const dataSelecionada = watch("data");

  // Carregar histórico dos últimos 30 dias
  useEffect(() => {
    async function carregarHistorico() {
      setIsHistoricoLoading(true);
      try {
        const registros = await getUltimos30Dias();
        setHistoricoLancamentos(registros);
      } catch (e) {
        toast({ 
          title: "Erro ao carregar histórico", 
          description: "Não foi possível carregar o histórico de lançamentos.", 
          variant: "destructive" 
        });
        console.error("Erro ao carregar histórico:", e);
      } finally {
        setIsHistoricoLoading(false);
      }
    }
    
    carregarHistorico();
  }, []);

  useEffect(() => {
    async function fetchQuantidade() {
      setIsFetching(true);
      try {
        const dataObj = new Date(dataSelecionada);
        const registro = await getPorData(dataObj);
        if (registro) {
          setValue("quantidade", registro.quantidade);
        } else {
          setValue("quantidade", 0);
        }
      } catch (e) {
        toast({ title: "Erro ao buscar quantidade", description: String(e), variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    }
    fetchQuantidade();
  }, [dataSelecionada, setValue]);

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      // Criar data a partir do valor do formulário
      const dataObj = new Date(values.data + "T12:00:00"); // Adicionar horário para evitar problemas de fuso
      
      await salvarOuAtualizar(dataObj, values.quantidade);
      toast({ 
        title: "Salvo com sucesso", 
        description: `Quantidade registrada: ${values.quantidade} alunos para ${format(dataObj, "dd/MM/yyyy")}` 
      });
      
      // Atualizar o histórico após salvar
      const registros = await getUltimos30Dias();
      setHistoricoLancamentos(registros);
    } catch (e) {
      toast({ title: "Erro ao salvar", description: String(e), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // Função para formatar data em pt-BR
  function formatarData(data: Date): string {
    return format(data, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Função para selecionar um registro para edição
  function editarRegistro(registro: RefeicaoPorKilo) {
    const dataFormatada = format(registro.data, "yyyy-MM-dd");
    setValue("data", dataFormatada);
    setValue("quantidade", registro.quantidade);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ 
      title: "Registro selecionado", 
      description: `${formatarData(registro.data)} - ${registro.quantidade} alunos` 
    });
  }

  return (
    <ProtectedRoute allowedProfiles={["ADMIN", "COORDENADOR"]}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Refeições por Quilo</h1>
        
        {/* Formulário */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Registrar Quantidade</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input type="date" id="data" {...register("data")} disabled={isFetching || isLoading} />
                {errors.data && <span className="text-red-600 text-sm">{errors.data.message}</span>}
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade de alunos</Label>
                <Input type="number" id="quantidade" min={0} {...register("quantidade", { valueAsNumber: true })} disabled={isFetching || isLoading} />
                {errors.quantidade && <span className="text-red-600 text-sm">{errors.quantidade.message}</span>}
              </div>
            </div>
            <Button type="submit" disabled={isLoading || isFetching} className="w-full">
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </div>
        
        {/* Tabela de histórico */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Histórico dos Últimos 30 Dias</h2>
          
          {isHistoricoLoading ? (
            <div className="text-center py-8">Carregando histórico...</div>
          ) : historicoLancamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum registro encontrado nos últimos 30 dias.
            </div>
          ) : (
            <Table>
              <TableCaption>Histórico de refeições por quilo registradas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoLancamentos.map((registro) => (
                  <TableRow key={registro.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{formatarData(registro.data)}</TableCell>
                    <TableCell className="text-right">{registro.quantidade}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => editarRegistro(registro)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 