'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !passwordConfirm) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Tentando registrar...');
      await signUp(email, password, name);
      console.log('Registro bem-sucedido!');
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Erro detalhado ao registrar:', err);
      
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('Este email já está em uso');
            break;
          case 'auth/invalid-email':
            setError('Email inválido');
            break;
          case 'auth/weak-password':
            setError('Senha muito fraca');
            break;
          default:
            setError(`Erro ao registrar: ${err.message}`);
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
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registre-se para começar a usar o sistema
          </p>
        </div>
        
        {error && (
          <Alert severity="error" className="mt-4">
            {error}
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              disabled={loading || authLoading}
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              disabled={loading || authLoading}
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading || authLoading}
            />

            <Input
              label="Confirme a senha"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirme sua senha"
              disabled={loading || authLoading}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={loading || authLoading}
              isLoading={loading || authLoading}
            >
              {loading || authLoading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>

          <div className="text-sm text-center">
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Já tem uma conta? Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
