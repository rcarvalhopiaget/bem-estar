'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Save, Send, Plus, X, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'react-hot-toast';
import { getConfiguracaoRelatorio, salvarConfiguracaoRelatorio, enviarEmailTesteAction } from '@/actions/configRelatorioActions';
import type { ConfiguracaoRelatorio } from '@/actions/configRelatorioActions';

export default function ConfiguracoesRelatorios() {
  const [config, setConfig] = useState<ConfiguracaoRelatorio>({ emails: [''], horario: '18:00', ativo: true });
  const [carregando, setCarregando] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | false | undefined>(undefined);
  const router = useRouter();
  const { podeGerenciarConfiguracoes } = usePermissions();

  const [isSalvarPending, startSalvarTransition] = useTransition();
  const [isTestePending, startTesteTransition] = useTransition();

  useEffect(() => {
    const carregarConfiguracao = async () => {
      setCarregando(true);
      const resultado = await getConfiguracaoRelatorio();
      if (resultado.success && resultado.data) {
        const emailsParaMostrar = resultado.data.emails.length > 0 ? resultado.data.emails : [''];
        setConfig({ ...resultado.data, emails: emailsParaMostrar });
      } else {
        console.error('Erro ao carregar configuração:', resultado.error);
        toast.error(`Erro ao carregar configuração: ${resultado.error || 'Erro desconhecido'}`);
        setConfig({ emails: [''], horario: '18:00', ativo: true });
      }
      setCarregando(false);
    };

    if (podeGerenciarConfiguracoes) {
      carregarConfiguracao();
    } else {
      setCarregando(false);
    }
  }, [podeGerenciarConfiguracoes]);

  const handleSalvar = () => {
    const emailsValidos = config.emails.filter(email => email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    const dadosParaSalvar: ConfiguracaoRelatorio = { ...config, emails: emailsValidos };
    
    if (dadosParaSalvar.emails.length === 0) {
      toast.error('É necessário informar pelo menos um email válido.');
      return;
    }
    if (!dadosParaSalvar.horario || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dadosParaSalvar.horario)) {
      toast.error('Formato de horário inválido (HH:MM).');
      return;
    }

    startSalvarTransition(async () => {
      const resultado = await salvarConfiguracaoRelatorio(dadosParaSalvar);
      if (resultado.success) {
        toast.success('Configuração salva com sucesso!');
        setConfig(dadosParaSalvar);
      } else {
        console.error('Erro ao salvar configuração:', resultado.error, resultado.fieldErrors);
        if (resultado.fieldErrors) {
          Object.values(resultado.fieldErrors).flat().forEach(error => toast.error(error || 'Erro de validação'));
        } else {
          toast.error(`Erro ao salvar: ${resultado.error || 'Erro desconhecido'}`);
        }
      }
    });
  };

  const handleEnviarTeste = () => {
    const primeiroEmailValido = config.emails.find(email => email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (!primeiroEmailValido) {
      toast.error('Informe pelo menos um email válido na lista para enviar o teste.');
      return;
    }

    startTesteTransition(async () => {
      setPreviewUrl(undefined);
      toast.loading('Enviando email de teste...');

      const resultado = await enviarEmailTesteAction(primeiroEmailValido);
      
      toast.dismiss();

      if (resultado.success) {
        toast.success(resultado.message);
        setPreviewUrl(resultado.previewUrl);
      } else {
        toast.error(resultado.message);
      }
    });
  };

  const adicionarEmail = () => {
    setConfig(prev => ({ ...prev, emails: [...prev.emails, ''] }));
  };

  const removerEmail = (index: number) => {
    setConfig(prev => {
      const novosEmails = [...prev.emails];
      novosEmails.splice(index, 1);
      if (novosEmails.length === 0) {
        novosEmails.push('');
      }
      return { ...prev, emails: novosEmails };
    });
  };

  const atualizarEmail = (index: number, valor: string) => {
    setConfig(prev => {
      const novosEmails = [...prev.emails];
      novosEmails[index] = valor;
      return { ...prev, emails: novosEmails };
    });
  };

  const atualizarHorario = (valor: string) => {
    setConfig(prev => ({ ...prev, horario: valor }));
  };

  const atualizarAtivo = (valor: boolean) => {
    setConfig(prev => ({ ...prev, ativo: valor }));
  };

  if (carregando && !podeGerenciarConfiguracoes) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!podeGerenciarConfiguracoes) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-6">Você não tem permissão para gerenciar as configurações de relatórios.</p>
        <Button onClick={() => router.push('/')}>Voltar para o Início</Button>
      </div>
    );
  }

  const hasInvalidEmail = config.emails.some(email => email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const hasNoValidEmails = config.emails.every(email => email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configurações de Relatórios</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Envio Automático de Relatórios</CardTitle>
          <CardDescription>
            Configure os emails e o horário para o envio automático de relatórios diários.
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
                <Label>Emails para receber relatórios</Label>
                {config.emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => atualizarEmail(index, e.target.value)}
                      className={cn(
                        "flex-1",
                        email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removerEmail(index)}
                      disabled={config.emails.length === 1}
                      className="shrink-0"
                      aria-label="Remover email"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {config.emails.some(email => email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && (
                  <p className="text-sm text-destructive">Um ou mais emails parecem inválidos.</p>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-2 self-start"
                  onClick={adicionarEmail}
                  disabled={isSalvarPending || isTestePending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar email
                </Button>
              </div>

              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="horario">Horário de envio (UTC)</Label>
                <Input
                  id="horario"
                  type="time"
                  value={config.horario}
                  onChange={(e) => atualizarHorario(e.target.value)}
                  disabled={isSalvarPending || isTestePending}
                  className={cn(
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(config.horario) && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {!/^([01]\d|2[0-3]):([0-5]\d)$/.test(config.horario) && (
                  <p className="text-sm text-destructive">Formato de horário inválido (HH:MM).</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Os relatórios serão enviados diariamente neste horário (fuso horário do servidor - UTC).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={config.ativo}
                  onCheckedChange={atualizarAtivo}
                  disabled={isSalvarPending || isTestePending}
                  aria-label="Ativar envio automático de relatórios"
                />
                <Label htmlFor="ativo">Ativar envio automático de relatórios</Label>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={handleEnviarTeste}
            disabled={isTestePending || isSalvarPending || hasNoValidEmails || hasInvalidEmail}
            className="w-full sm:w-auto"
          >
            {isTestePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Teste (para o 1º email)
              </>
            )}
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={isSalvarPending || isTestePending || hasNoValidEmails || hasInvalidEmail}
            className="w-full sm:w-auto"
          >
            {isSalvarPending ? (
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
        <Card className="mt-4 bg-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">Visualização do Email de Teste (Ethereal)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700 mb-2">
              O email de teste (simulado) foi enviado. Você pode visualizá-lo no link abaixo:
            </p>
            <a 
              href={previewUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {previewUrl}
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Nota: Este link é temporário e fornecido pelo serviço Ethereal para emails simulados.
            </p>
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
