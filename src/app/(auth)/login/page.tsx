'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

// Componente Button incorporado
const Button = ({ 
  children, 
  className = "", 
  isLoading = false, 
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{typeof children === 'string' ? 'Carregando...' : children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Componente Input incorporado
const Input = ({ 
  label, 
  className = "", 
  type = "text", 
  ...props 
}: {
  label?: string;
  className?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
};

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
          <p className="mt-2 text-center text-sm text-blue-600">
            <strong>Dica:</strong> Utilize admin@example.com com qualquer senha de 6+ caracteres
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
              label="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              disabled={loading || authLoading}
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
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
