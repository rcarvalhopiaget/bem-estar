'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await signUp(data.email, data.password);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso');
      } else {
        setError('Ocorreu um erro ao criar a conta');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            
            <Input
              label="Senha"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirme a senha"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            Criar conta
          </Button>
          
          <div className="text-sm text-center mt-4">
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