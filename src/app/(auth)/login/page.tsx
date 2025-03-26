'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Iniciando login com email:', data.email);
      setLoginError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Login bem-sucedido:', userCredential.user.email);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro detalhado ao fazer login:', error);
      
      const errorCode = error?.code;
      console.log('Código do erro:', errorCode);
      
      switch (errorCode) {
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
          setLoginError('Erro ao fazer login. Tente novamente');
      }
    }
  };

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
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 text-lg"
              isLoading={isSubmitting}
            >
              Entrar
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