'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { useAuth } from '@/contexts/AuthContext'; // Mantido comentado por enquanto
import { FirebaseError } from 'firebase/app';
// import { Button } from '../../../components/ui/button'; // Alterado para alias
// import { Input } from '../../../components/ui/input'; // Alterado para alias
import { Button } from '@/components/ui/button'; // Usando alias
import { Input } from '@/components/ui/input'; // Usando alias
import { useAuth } from '@/contexts/AuthContext'; // Usando alias

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Tentando fazer login...');
      await signIn(email, password);
      console.log('Login bem-sucedido!');
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Erro detalhado ao fazer login:', err);
      
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Email ou senha incorretos');
            break;
          case 'auth/invalid-email':
            setError('Email inválido');
            break;
          case 'auth/too-many-requests':
            setError('Muitas tentativas. Tente novamente mais tarde');
            break;
          default:
            setError(`Erro ao fazer login: ${err.message}`);
        }
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente');
      }
    } finally {
      setLoading(false);
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
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                disabled={loading || authLoading}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={loading || authLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? 'Entrando...' : 'Entrar'}
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
