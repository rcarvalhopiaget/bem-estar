'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  getConfiguracaoRelatorio,
  salvarConfiguracaoRelatorio,
  ConfiguracaoRelatorio,
} from '@/actions/configRelatorioActions';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Schema para validação do formulário (apenas horário e ativo)
const ConfigSchema = z.object({
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de horário inválido (HH:MM).',
  }),
  ativo: z.boolean(),
});

type ConfigFormData = z.infer<typeof ConfigSchema>;

export function ReportConfigForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEmails, setCurrentEmails] = useState<string[]>([]); // Para reenviar ao salvar

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      horario: '18:00', // Valor padrão inicial
      ativo: true,
    },
  });

  // Buscar configuração inicial
  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true);
      const result = await getConfiguracaoRelatorio();
      if (result.success && result.data) {
        form.reset({
          horario: result.data.horario,
          ativo: result.data.ativo,
        });
        setCurrentEmails(result.data.emails); // Guardar emails atuais
      } else {
        toast({
          title: 'Erro ao buscar configuração',
          description: result.error || 'Não foi possível carregar a configuração atual.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }
    fetchConfig();
  }, [form, toast]);

  // Função de submit
  async function onSubmit(data: ConfigFormData) {
    setIsSaving(true);
    
    // Remontar o objeto completo para a action
    const fullConfig: ConfiguracaoRelatorio = {
      emails: currentEmails, // Usar os emails buscados
      horario: data.horario,
      ativo: data.ativo,
    };

    const result = await salvarConfiguracaoRelatorio(fullConfig);

    if (result.success) {
      toast({
        title: 'Configuração Salva',
        description: 'Horário e status do envio automático atualizados.',
      });
    } else {
      toast({
        title: 'Erro ao Salvar',
        description: result.error || 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
      // Opcional: reverter form se houver erro?
      // form.reset(data); // Ou buscar novamente
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando configuração...
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="horario">Horário de Envio (HH:MM)</Label>
          <Input
            id="horario"
            type="time" // Usar input type time para melhor UX
            {...form.register('horario')}
            disabled={isSaving}
          />
          {form.formState.errors.horario && (
            <p className="text-sm text-destructive">
              {form.formState.errors.horario.message}
            </p>
          )}
        </div>
        <div className="flex items-end space-x-2 pb-2">
           <div className="flex items-center space-x-2">
             <Switch 
               id="ativo"
               checked={form.watch('ativo')} 
               onCheckedChange={(checked) => form.setValue('ativo', checked)} 
               disabled={isSaving}
             />
             <Label htmlFor="ativo">Envio Automático Ativo</Label>
          </div>
        </div>
      </div>
      
      <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
        {isSaving ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
        ) : (
          'Salvar Configuração'
        )}
      </Button>
      {!form.formState.isDirty &&
        <p className="text-sm text-muted-foreground italic">Nenhuma alteração detectada.</p>
      }
    </form>
  );
} 