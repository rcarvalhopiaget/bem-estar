'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/separator';
import { useState, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Save, Send } from 'lucide-react';
import { obterConfiguracaoEnvioRelatorio, salvarConfiguracaoEnvioRelatorio, enviarEmailTeste } from '@/services/emailService';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'react-hot-toast';

export default function ConfiguracoesRelatorios() {
  const [email, setEmail] = useState('');
  const [horario, setHorario] = useState('18:00');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const { podeGerenciarConfiguracoes } = usePermissions();

  useEffect(() => {
    const carregarConfiguracao = async () => {
      try {
        setCarregando(true);
        const config = await obterConfiguracaoEnvioRelatorio();
        setEmail(config.email || '');
        setHorario(config.horario || '18:00');
        setAtivo(config.ativo !== undefined ? config.ativo : true);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        toast.error('Erro ao carregar configuração. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarConfiguracao();
  }, []);

  const handleSalvar = async () => {
    if (!email) {
      toast.error('O email é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      await salvarConfiguracaoEnvioRelatorio(email, horario, ativo);
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEnviarTeste = async () => {
    if (!email) {
      toast.error('O email é obrigatório');
      return;
    }

    try {
      setEnviandoTeste(true);
      setPreviewUrl(null); // Limpar URL anterior
      const resultado = await enviarEmailTeste(0); // Enviar imediatamente
      
      if (resultado.success) {
        toast.success(resultado.message);
        if (resultado.previewUrl) {
          setPreviewUrl(resultado.previewUrl);
        }
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste. Tente novamente.');
    } finally {
      setEnviandoTeste(false);
    }
  };

  if (!podeGerenciarConfiguracoes) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => router.push('/')}>Voltar para o Início</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configurações de Relatórios</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Envio Automático de Relatórios</CardTitle>
          <CardDescription>
            Configure o envio automático de relatórios diários por email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email para receber relatórios</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="horario">Horário de envio</Label>
                <Input
                  id="horario"
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Os relatórios serão enviados diariamente neste horário
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
                <Label htmlFor="ativo">Ativar envio automático de relatórios</Label>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleEnviarTeste}
            disabled={enviandoTeste || !email}
          >
            {enviandoTeste ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Teste
              </>
            )}
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={salvando || !email}
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {previewUrl && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Visualização do Email de Teste</CardTitle>
            <CardDescription>
              O email de teste foi enviado com sucesso. Você pode visualizá-lo no link abaixo:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-gray-600">
                Este é um link temporário para visualizar o email enviado. Ele ficará disponível por um tempo limitado.
              </p>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                <Mail className="mr-2 h-4 w-4" />
                Abrir visualização do email
              </a>
              <div className="bg-gray-100 p-4 rounded-md mt-2">
                <p className="text-xs font-mono break-all">{previewUrl}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Envio Manual de Relatórios</CardTitle>
          <CardDescription>
            Envie relatórios manualmente para datas específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Você pode enviar relatórios manualmente para datas específicas. Isso é útil para enviar relatórios de dias anteriores ou para reenviar relatórios que não foram enviados automaticamente.
            </p>
            
            <Button
              variant="secondary"
              onClick={() => router.push('/relatorios')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Ir para Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
