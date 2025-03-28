'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TIPOS_REFEICAO } from '@/types/refeicao';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const refeicaoSchema = z.object({
  alunoId: z.string().min(1, 'Selecione um aluno'),
  nomeAluno: z.string().min(1, 'Nome do aluno é obrigatório'),
  turma: z.string().min(1, 'Turma é obrigatória'),
  data: z.string().min(1, 'Data é obrigatória'),
  tipo: z.enum(['ALMOCO', 'LANCHE_MANHA', 'LANCHE_TARDE'], {
    errorMap: () => ({ message: 'Selecione um tipo de refeição' })
  }),
  presente: z.boolean(),
  observacao: z.string().optional()
});

type RefeicaoFormData = z.infer<typeof refeicaoSchema>;

interface RefeicaoFormProps {
  alunos: Array<{ id: string; nome: string; turma: string }>;
  onSubmit: (data: RefeicaoFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<RefeicaoFormData>;
}

export function RefeicaoForm({ alunos, onSubmit, onCancel, defaultValues }: RefeicaoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RefeicaoFormData>({
    resolver: zodResolver(refeicaoSchema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      presente: false,
      ...defaultValues
    }
  });

  const alunoId = watch('alunoId');

  // Atualiza nome e turma quando o aluno é selecionado
  const handleAlunoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAluno = alunos.find(a => a.id === event.target.value);
    if (selectedAluno) {
      setValue('nomeAluno', selectedAluno.nome);
      setValue('turma', selectedAluno.turma);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Aluno
          </label>
          <select
            {...register('alunoId')}
            onChange={handleAlunoChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Selecione um aluno</option>
            {alunos.map(aluno => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome} - {aluno.turma}
              </option>
            ))}
          </select>
          {errors.alunoId && (
            <p className="mt-1 text-sm text-red-600">{errors.alunoId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data
          </label>
          <input
            type="date"
            {...register('data')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          {errors.data && (
            <p className="mt-1 text-sm text-red-600">{errors.data.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Refeição
          </label>
          <select
            {...register('tipo')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Selecione o tipo</option>
            {Object.entries(TIPOS_REFEICAO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.tipo && (
            <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Presente
          </label>
          <div className="mt-1">
            <input
              type="checkbox"
              {...register('presente')}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="ml-2">Aluno presente</span>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Observação
          </label>
          <textarea
            {...register('observacao')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="Observações adicionais..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Campos ocultos para nome e turma */}
      <input type="hidden" {...register('nomeAluno')} />
      <input type="hidden" {...register('turma')} />
    </form>
  );
} 