'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Aluno, AlunoFormData } from '@/types/aluno';

const alunoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  matricula: z.string().min(4, 'A matrícula deve ter pelo menos 4 caracteres'),
  email: z.string().email('Email inválido'),
  tipo: z.enum(['MENSALISTA', 'INTEGRAL_5X', 'INTEGRAL_4X', 'INTEGRAL_3X', 'INTEGRAL_2X']),
  turma: z.string().min(1, 'A turma é obrigatória'),
  ativo: z.boolean(),
});

interface AlunoFormProps {
  aluno?: Aluno;
  onSubmit: (data: AlunoFormData) => Promise<void>;
  onCancel: () => void;
}

export function AlunoForm({ aluno, onSubmit, onCancel }: AlunoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: aluno || {
      ativo: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome"
        {...register('nome')}
        error={errors.nome?.message}
      />

      <Input
        label="Matrícula"
        {...register('matricula')}
        error={errors.matricula?.message}
      />

      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <select
          {...register('tipo')}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="MENSALISTA">Mensalista</option>
          <option value="INTEGRAL_5X">Integral (5x por semana)</option>
          <option value="INTEGRAL_4X">Integral (4x por semana)</option>
          <option value="INTEGRAL_3X">Integral (3x por semana)</option>
          <option value="INTEGRAL_2X">Integral (2x por semana)</option>
        </select>
        {errors.tipo?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      <Input
        label="Turma"
        {...register('turma')}
        error={errors.turma?.message}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('ativo')}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Ativo
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {aluno ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
} 