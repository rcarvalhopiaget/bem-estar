'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Aluno, AlunoFormData } from '@/types/aluno';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DIAS_POR_TIPO: Record<string, number | null> = {
  MENSALISTA: null,
  MENSALISTA_GRATUIDADE: null,
  INTEGRAL_5X: 5,
  INTEGRAL_4X: 4,
  INTEGRAL_3X: 3,
  INTEGRAL_2X: 2,
  INTEGRAL_1X: 1,
  ESTENDIDO_5X: 5,
  ESTENDIDO_4X: 4,
  ESTENDIDO_3X: 3,
  ESTENDIDO_2X: 2,
  ESTENDIDO_1X: 1,
  AVULSO: null,
  AVULSO_RESTAURANTE: null,
  AVULSO_SECRETARIA: null,
  SEMI_INTEGRAL: null,
  ESTENDIDO: null
};

const DIAS_SEMANA = [
  { id: 1, nome: 'Segunda' },
  { id: 2, nome: 'Terça' },
  { id: 3, nome: 'Quarta' },
  { id: 4, nome: 'Quinta' },
  { id: 5, nome: 'Sexta' },
  { id: 0, nome: 'Domingo' },
  { id: 6, nome: 'Sábado' },
];

const alunoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  matricula: z.string().min(4, 'A matrícula deve ter pelo menos 4 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tipo: z.enum([
    'MENSALISTA', 
    'MENSALISTA_GRATUIDADE',
    'INTEGRAL_5X', 
    'INTEGRAL_4X', 
    'INTEGRAL_3X', 
    'INTEGRAL_2X', 
    'INTEGRAL_1X', 
    'AVULSO',
    'AVULSO_RESTAURANTE',
    'AVULSO_SECRETARIA',
    'SEMI_INTEGRAL', 
    'ESTENDIDO', 
    'ESTENDIDO_5X', 
    'ESTENDIDO_4X', 
    'ESTENDIDO_3X', 
    'ESTENDIDO_2X', 
    'ESTENDIDO_1X'
  ]),
  turma: z.string().min(1, 'A turma é obrigatória'),
  ativo: z.boolean(),
  diasRefeicaoPermitidos: z.array(z.number()).optional(),
}).refine((data) => {
  const diasExigidos = DIAS_POR_TIPO[data.tipo];
  if (diasExigidos !== null) {
    return Array.isArray(data.diasRefeicaoPermitidos) && data.diasRefeicaoPermitidos.length === diasExigidos;
  }
  return true;
}, {
  message: 'Selecione o número exato de dias permitido para este tipo de plano.',
  path: ['diasRefeicaoPermitidos'],
});

const TIPOS_ALUNO = {
  'MENSALISTA': 'Mensalista',
  'MENSALISTA_GRATUIDADE': 'Mensalista (Gratuidade)',
  'INTEGRAL_5X': 'Integral (5x/semana)',
  'INTEGRAL_4X': 'Integral (4x/semana)',
  'INTEGRAL_3X': 'Integral (3x/semana)',
  'INTEGRAL_2X': 'Integral (2x/semana)',
  'INTEGRAL_1X': 'Integral (1x/semana)',
  'ESTENDIDO_5X': 'Estendido (5x/semana)',
  'ESTENDIDO_4X': 'Estendido (4x/semana)',
  'ESTENDIDO_3X': 'Estendido (3x/semana)',
  'ESTENDIDO_2X': 'Estendido (2x/semana)',
  'ESTENDIDO_1X': 'Estendido (1x/semana)',
  'SEMI_INTEGRAL': 'Semi-Integral',
  'ESTENDIDO': 'Estendido',
  'AVULSO': 'Avulso',
  'AVULSO_RESTAURANTE': 'Avulso (Restaurante)',
  'AVULSO_SECRETARIA': 'Avulso (Secretaria)',
};

interface AlunoFormProps {
  aluno?: Aluno;
  onSubmit: (data: AlunoFormData) => Promise<void>;
  onCancel: () => void;
  turmas?: string[]; // Lista de turmas disponíveis
}

export function AlunoForm({ aluno, onSubmit, onCancel, turmas = [] }: AlunoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
    trigger
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: aluno ? {
       ...aluno,
       diasRefeicaoPermitidos: aluno.diasRefeicaoPermitidos || []
    } : {
      ativo: true,
      tipo: 'MENSALISTA',
      diasRefeicaoPermitidos: []
    },
  });
  
  const tipoAluno = watch('tipo');
  const diasSelecionados = watch('diasRefeicaoPermitidos') || [];
  const diasExigidos = DIAS_POR_TIPO[tipoAluno];

  useEffect(() => {
    if (diasExigidos !== null) {
      trigger('diasRefeicaoPermitidos');
    }
  }, [tipoAluno, diasExigidos, setValue, trigger]);

  const handleDiaChange = (diaId: number, checked: boolean) => {
    const currentDias = getValues('diasRefeicaoPermitidos') || [];
    let newDias: number[];
    if (checked) {
      newDias = [...currentDias, diaId];
    } else {
      newDias = currentDias.filter((id) => id !== diaId);
    }
    newDias.sort((a, b) => a - b);
    setValue('diasRefeicaoPermitidos', newDias, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">
          Nome do Aluno
        </Label>
        <Input
          type="text"
          {...register('nome')}
          className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Digite o nome completo"
        />
        {errors.nome?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">
          Número de Matrícula
        </Label>
        <Input
          type="text"
          {...register('matricula')}
          className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Digite a matrícula"
        />
        {errors.matricula?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.matricula.message}</p>
        )}
      </div>

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">
          Email de Contato (Opcional)
        </Label>
        <Input
          type="email"
          {...register('email')}
          className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="exemplo@email.com"
        />
        {errors.email?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">
          Tipo de Aluno
        </Label>
        <select
          {...register('tipo')}
          className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
        >
          {Object.entries(TIPOS_ALUNO).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </select>
        {errors.tipo?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.tipo.message}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          O tipo de aluno define o limite de refeições por semana
        </p>
      </div>

      {!['AVULSO', 'AVULSO_RESTAURANTE', 'AVULSO_SECRETARIA'].includes(tipoAluno) && (
        <div>
          <Label className="block text-lg font-medium text-gray-700 mb-2">
            Dias Permitidos 
            {diasExigidos !== null ? `(${diasSelecionados.length} de ${diasExigidos} selecionados)` : '(Opcional)'}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`dia-${dia.id}`}
                  checked={diasSelecionados.includes(dia.id)}
                  onCheckedChange={(checked: boolean) => handleDiaChange(dia.id, checked)}
                />
                <Label htmlFor={`dia-${dia.id}`} className="text-base font-normal">
                  {dia.nome}
                </Label>
              </div>
            ))}
          </div>
          {errors.diasRefeicaoPermitidos?.message && (
            <p className="mt-2 text-sm text-red-600">{errors.diasRefeicaoPermitidos.message}</p>
          )}
        </div>
      )}

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">
          Turma
        </Label>
        {turmas.length > 0 ? (
          <div>
            <Select
              value={watch('turma')}
              onValueChange={(value) => setValue('turma', value, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                ))}
                {/* Opção para digitar uma nova turma caso seja necessário */}
                <SelectItem value="__nova_turma__">+ Nova turma</SelectItem>
              </SelectContent>
            </Select>
            {watch('turma') === '__nova_turma__' && (
              <Input
                type="text"
                className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary mt-2"
                placeholder="Digite a nova turma"
                value={getValues('turma') === '__nova_turma__' ? '' : getValues('turma')}
                onChange={(e) => setValue('turma', e.target.value, { shouldValidate: true })}
              />
            )}
          </div>
        ) : (
          <Input
            type="text"
            {...register('turma')}
            className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Digite a turma (ex: 1A, 2B)"
          />
        )}
        {errors.turma?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.turma.message}</p>
        )}
      </div>

      <div className="flex items-center py-2">
        <Checkbox
          id="ativo"
          checked={watch('ativo')}
          onCheckedChange={(checked: CheckedState) => setValue('ativo', !!checked)}
          className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <Label htmlFor="ativo" className="ml-3 text-lg font-medium text-gray-700">
          Aluno Ativo
        </Label>
        <p className="ml-2 text-sm text-gray-500">
          (Apenas alunos ativos podem realizar refeições)
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6 py-3 text-lg"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-lg bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? 'Salvando...' : aluno ? 'Salvar Alterações' : 'Criar Aluno'}
        </Button>
      </div>
    </form>
  );
}