'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Refeicao, TIPOS_REFEICAO, TipoRefeicao } from '@/types/refeicao';
import { AlunoTipo } from '@/types/aluno';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Mapeia os tipos de aluno para rótulos legíveis
const TIPOS_ALUNO_LABELS: Record<AlunoTipo, string> = {
  AVULSO: 'Avulso',
  AVULSO_RESTAURANTE: 'Avulso (Restaurante)',
  AVULSO_SECRETARIA: 'Avulso (Secretaria)',
  INTEGRAL_5X: 'Integral 5x',
  INTEGRAL_4X: 'Integral 4x',
  INTEGRAL_3X: 'Integral 3x',
  INTEGRAL_2X: 'Integral 2x',
  INTEGRAL_1X: 'Integral 1x',
  MENSALISTA: 'Mensalista',
  MENSALISTA_GRATUIDADE: 'Mensalista (Gratuidade)',
  SEMI_INTEGRAL: 'Semi Integral',
  ESTENDIDO: 'Estendido',
  ESTENDIDO_5X: 'Estendido 5x',
  ESTENDIDO_4X: 'Estendido 4x',
  ESTENDIDO_3X: 'Estendido 3x',
  ESTENDIDO_2X: 'Estendido 2x',
  ESTENDIDO_1X: 'Estendido 1x'
};

interface CorrecaoRefeicaoModalProps {
  refeicao: Refeicao | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (refeicao: Refeicao) => Promise<void>;
}

export function CorrecaoRefeicaoModal({
  refeicao,
  isOpen,
  onClose,
  onSave,
}: CorrecaoRefeicaoModalProps) {
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const [formData, setFormData] = useState<Refeicao | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar o formulário quando a refeição muda
  useEffect(() => {
    if (refeicao) {
      setFormData({ ...refeicao });
    } else {
      setFormData(null);
    }
  }, [refeicao]);

  // Verificar se o usuário é um administrador
  useEffect(() => {
    if (isOpen && !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem corrigir refeições.",
        variant: "destructive",
      });
      onClose();
    }
  }, [isOpen, isAdmin, onClose, toast]);

  if (!formData) return null;

  // Verificação adicional de permissão
  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Apenas administradores podem corrigir refeições.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleFormChange = (
    field: keyof Refeicao,
    value: string | boolean | Date
  ) => {
    setFormData((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData) return;

    // Verificação final de permissão antes de salvar
    if (!isAdmin) {
      toast({
        title: "Permissão Negada",
        description: "Apenas administradores podem corrigir refeições.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSave(formData);
      toast({
        title: 'Refeição atualizada',
        description: 'A refeição foi corrigida com sucesso.',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Ocorreu um erro ao corrigir a refeição.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = formData.data
    ? format(new Date(formData.data), 'yyyy-MM-dd')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corrigir Refeição</DialogTitle>
          <DialogDescription>
            Use este formulário para corrigir detalhes da refeição.
            Esta ação será registrada no histórico de atividades.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="nomeAluno" className="font-semibold">
              Aluno
            </Label>
            <Input
              id="nomeAluno"
              value={formData.nomeAluno}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data" className="font-semibold">
                Data
              </Label>
              <Input
                id="data"
                type="date"
                value={formattedDate}
                onChange={(e) =>
                  handleFormChange('data', new Date(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="font-semibold">
                Tipo de Refeição
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: TipoRefeicao) =>
                  handleFormChange('tipo', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_REFEICAO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoConsumo" className="font-semibold">
                Tipo de Consumo
              </Label>
              <Select
                value={formData.tipoConsumo || ''}
                onValueChange={(value: string) =>
                  handleFormChange('tipoConsumo', value === '' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de consumo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {Object.entries(TIPOS_ALUNO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="presente"
                  checked={formData.presente}
                  onCheckedChange={(checked) =>
                    handleFormChange('presente', checked === true)
                  }
                />
                <label
                  htmlFor="presente"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Marcar como Presente
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao" className="font-semibold">
              Observação
            </Label>
            <Textarea
              id="observacao"
              value={formData.observacao || ''}
              onChange={(e) => handleFormChange('observacao', e.target.value)}
              placeholder="Adicione observações sobre esta correção"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 