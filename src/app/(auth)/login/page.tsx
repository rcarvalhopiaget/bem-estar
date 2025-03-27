'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@mui/material';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useFirebaseAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      console.log('Tentando fazer login...');
      await signIn(data.email, data.password);
      console.log('Login bem-sucedido!');
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro detalhado ao fazer login:', error);
      
      switch (error?.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setLoginError('Email ou senha incorretos');
          break;
        case 'auth/too-many-requests':
          setLoginError('Muitas tentativas de login. Tente novamente mais tarde');
          break;
        case 'auth/network-request-failed':
          setLoginError('Erro de conexão. Verifique sua internet');
          break;
        case 'auth/invalid-email':
          setLoginError('Email inválido');
          break;
        case 'auth/user-disabled':
          setLoginError('Esta conta foi desativada');
          break;
        default:
          setLoginError(`Erro ao fazer login: ${error.message || 'Tente novamente'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Carregando...</h2>
          <p className="text-gray-600">Inicializando o sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Bem-vindo de volta!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>
        
        {loginError && (
          <Alert severity="error" className="mt-4">
            {loginError}
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Digite seu email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>

          <div className="text-sm text-center">
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              Não tem uma conta? Registre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}