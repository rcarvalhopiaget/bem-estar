'use client';

import { useEffect, useState } from 'react';
import { getReportEmailRecipients, removeReportEmailRecipient, toggleReportEmailRecipientStatus, type ReportEmailRecipient } from '@/services/reportEmailService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReportEmailListProps {
  triggerRefresh?: number;
}

export function ReportEmailList({ triggerRefresh = 0 }: ReportEmailListProps) {
  const [recipients, setRecipients] = useState<ReportEmailRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientToRemove, setRecipientToRemove] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchRecipients = async () => {
    setIsLoading(true);
    try {
      const data = await getReportEmailRecipients();
      setRecipients(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar destinatários',
        description: 'Não foi possível carregar a lista de destinatários. Tente novamente mais tarde.'
      });
      console.error('Erro ao buscar destinatários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, [triggerRefresh]);

  const handleRemove = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await removeReportEmailRecipient(id);
      setRecipients(prev => prev.filter(recipient => recipient.id !== id));
      toast({
        title: 'Destinatário removido',
        description: 'O email foi removido da lista de destinatários com sucesso.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover o destinatário. Tente novamente mais tarde.'
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
      setRecipientToRemove(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await toggleReportEmailRecipientStatus(id, !currentActive);
      setRecipients(prev => 
        prev.map(recipient => 
          recipient.id === id 
            ? { ...recipient, active: !currentActive } 
            : recipient
        )
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do destinatário. Tente novamente mais tarde.'
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum destinatário de email cadastrado. Adicione emails para receber relatórios diários.
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient) => (
            <TableRow key={recipient.id}>
              <TableCell className="font-medium">{recipient.email}</TableCell>
              <TableCell>{recipient.name || '—'}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={recipient.active}
                    onCheckedChange={() => handleToggleActive(recipient.id!, recipient.active)}
                    disabled={processingIds.has(recipient.id!)}
                  />
                  <span>{recipient.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog open={recipientToRemove === recipient.id} onOpenChange={(open) => !open && setRecipientToRemove(null)}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setRecipientToRemove(recipient.id!)}
                      disabled={processingIds.has(recipient.id!)}
                    >
                      {processingIds.has(recipient.id!) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o email {recipient.email} da lista de destinatários?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemove(recipient.id!)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 