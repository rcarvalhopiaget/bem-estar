import { Metadata } from 'next';
import { ReportEmailForm } from '@/components/reports/ReportEmailForm';
import { ReportEmailList } from '@/components/reports/ReportEmailList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, PlusCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Destinatários de Relatórios | Bem-Estar',
  description: 'Gerenciar destinatários de emails para relatórios diários',
};

export default function EmailRecipientsPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Destinatários de Relatórios</h1>
        <p className="text-muted-foreground">
          Gerencie os emails que receberão relatórios diários de refeições automaticamente.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Adicionar Destinatário
            </CardTitle>
            <CardDescription>
              Adicione novos emails para receberem relatórios diários de refeições.
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
              Lista de emails que receberão relatórios diários de refeições.
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