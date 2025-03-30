'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { addReportEmailRecipient } from '@/services/reportEmailService';
import { isValidEmail } from '@/utils/validation';

interface ReportEmailFormProps {
  onSuccess?: () => void;
}

export function ReportEmailForm({ onSuccess }: ReportEmailFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email obrigatório',
        description: 'Por favor, informe um email válido.'
      });
      return;
    }
    
    if (!isValidEmail(email)) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, informe um email válido.'
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addReportEmailRecipient({
        email: email.trim(),
        name: name.trim() || undefined,
        active: true
      });
      
      toast({
        title: 'Email adicionado com sucesso',
        description: 'O destinatário foi adicionado à lista de relatórios diários.'
      });
      
      // Limpar formulário
      setEmail('');
      setName('');
      
      // Callback opcional
      if (onSuccess) onSuccess();
    } catch (error) {
      let errorMessage = 'Ocorreu um erro ao adicionar o email.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nome (opcional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="Nome do destinatário"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Adicionando...' : 'Adicionar Destinatário'}
      </Button>
    </form>
  );
} 