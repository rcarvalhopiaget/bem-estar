'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Aluno, AlunoFormData } from '@/types/aluno';

const alunoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  matricula: z.string().min(4, 'A matrícula deve ter pelo menos 4 caracteres'),
  email: z.string().email('Email inválido'),
  tipo: z.enum(['MENSALISTA', 'INTEGRAL_5X', 'INTEGRAL_4X', 'INTEGRAL_3X', 'INTEGRAL_2X', 'AVULSO']),
  turma: z.string().min(1, 'A turma é obrigatória'),
  ativo: z.boolean(),
});

const TIPOS_ALUNO = {
  'MENSALISTA': 'Mensalista (sem limite)',
  'INTEGRAL_5X': 'Integral (5 refeições/semana)',
  'INTEGRAL_4X': 'Integral (4 refeições/semana)',
  'INTEGRAL_3X': 'Integral (3 refeições/semana)',
  'INTEGRAL_2X': 'Integral (2 refeições/semana)',
  'AVULSO': 'Avulso (pagamento por refeição)',
};

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
      tipo: 'MENSALISTA',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Nome do Aluno
        </label>
        <input
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
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Número de Matrícula
        </label>
        <input
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
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Email de Contato
        </label>
        <input
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
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Tipo de Aluno
        </label>
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

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Turma
        </label>
        <input
          type="text"
          {...register('turma')}
          className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Digite a turma (ex: 1A, 2B)"
        />
        {errors.turma?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.turma.message}</p>
        )}
      </div>

      <div className="flex items-center py-2">
        <input
          type="checkbox"
          {...register('ativo')}
          className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label className="ml-3 text-lg font-medium text-gray-700">
          Aluno Ativo
        </label>
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