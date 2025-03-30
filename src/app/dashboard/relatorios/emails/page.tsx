import { Metadata } from 'next';
import { ReportEmailForm } from '@/components/reports/ReportEmailForm';
import { ReportEmailList } from '@/components/reports/ReportEmailList';
import { ReportConfigForm } from '@/components/reports/ReportConfigForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, PlusCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Destinatários de Relatórios | Bem-Estar',
  description: 'Gerenciar destinatários e configurações de emails para relatórios diários',
};

export default function EmailRecipientsPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios por Email</h1>
        <p className="text-muted-foreground">
          Gerencie os destinatários e configure o envio automático dos relatórios diários.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuração de Envio Automático
          </CardTitle>
          <CardDescription>
            Defina o horário e ative ou desative o envio diário automático dos relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportConfigForm />
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Adicionar Destinatário
            </CardTitle>
            <CardDescription>
              Adicione novos emails para receberem os relatórios diários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportEmailForm />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck className="h-5 w-5" />
              Destinatários Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de emails que recebem os relatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportEmailList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 