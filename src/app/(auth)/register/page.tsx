'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.name);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Preencha os dados abaixo para começar
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Nome completo"
              type="text"
              placeholder="Digite seu nome"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Digite seu email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirme sua senha"
              type="password"
              placeholder="Digite sua senha novamente"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 text-lg"
              isLoading={isSubmitting}
            >
              Criar conta
            </Button>
          </div>

          <div className="text-sm text-center">
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Já tem uma conta? Entre aqui
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}