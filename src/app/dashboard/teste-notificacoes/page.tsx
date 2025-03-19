'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as hotToast } from 'react-hot-toast';
import { useToast } from '@/components/ui/use-toast';

export default function TesteNotificacoesPage() {
  const { toast } = useToast();
  const [count, setCount] = useState(0);

  // Função para demonstrar react-hot-toast
  const mostrarHotToast = (tipo: string) => {
    switch (tipo) {
      case 'success':
        hotToast.success('Operação realizada com sucesso!');
        break;
      case 'error':
        hotToast.error('Ocorreu um erro na operação.');
        break;
      case 'loading':
        hotToast.loading('Carregando...');
        break;
      case 'custom':
        hotToast('Notificação personalizada', {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          duration: 4000,
        });
        break;
      case 'promise':
        const promiseExample = new Promise((resolve) => {
          setTimeout(() => {
            resolve('Dados carregados');
          }, 2000);
        });

        hotToast.promise(
          promiseExample,
          {
            loading: 'Carregando dados...',
            success: 'Dados carregados com sucesso!',
            error: 'Erro ao carregar dados.',
          }
        );
        break;
      default:
        hotToast('Notificação padrão');
    }
  };

  // Função para demonstrar o toast do Radix UI
  const mostrarRadixToast = (tipo: string) => {
    const id = count + 1;
    setCount(id);

    switch (tipo) {
      case 'default':
        toast({
          title: 'Notificação padrão',
          description: 'Esta é uma notificação padrão do sistema.',
        });
        break;
      case 'success':
        toast({
          title: 'Sucesso!',
          description: 'Operação realizada com sucesso.',
          variant: 'default',
        });
        break;
      case 'destructive':
        toast({
          title: 'Erro!',
          description: 'Ocorreu um erro na operação.',
          variant: 'destructive',
        });
        break;
      case 'action':
        toast({
          title: 'Ação necessária',
          description: 'Você precisa realizar uma ação.',
          action: (
            <Button variant="outline" size="sm" onClick={() => hotToast.success('Ação realizada!')}>
              Confirmar
            </Button>
          ),
        });
        break;
      default:
        toast({
          title: `Notificação #${id}`,
          description: 'Descrição da notificação',
        });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Teste de Notificações</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>React Hot Toast</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => mostrarHotToast('success')} className="w-full">
              Sucesso
            </Button>
            <Button onClick={() => mostrarHotToast('error')} className="w-full" variant="warning">
              Erro
            </Button>
            <Button onClick={() => mostrarHotToast('loading')} className="w-full" variant="outline">
              Carregando
            </Button>
            <Button onClick={() => mostrarHotToast('custom')} className="w-full" variant="secondary">
              Personalizado
            </Button>
            <Button onClick={() => mostrarHotToast('promise')} className="w-full">
              Promise
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Radix UI Toast</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => mostrarRadixToast('default')} className="w-full">
              Padrão
            </Button>
            <Button onClick={() => mostrarRadixToast('success')} className="w-full">
              Sucesso
            </Button>
            <Button onClick={() => mostrarRadixToast('destructive')} className="w-full" variant="warning">
              Destrutivo
            </Button>
            <Button onClick={() => mostrarRadixToast('action')} className="w-full" variant="outline">
              Com Ação
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Informações sobre as notificações:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>React Hot Toast:</strong> Biblioteca leve e fácil de usar para notificações. Oferece animações suaves e é altamente personalizável.</li>
          <li><strong>Radix UI Toast:</strong> Componente de notificação acessível e personalizável do Radix UI, integrado com o sistema de design do projeto.</li>
        </ul>
      </div>
    </div>
  );
}
