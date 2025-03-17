'use client';

import { useState, useEffect } from 'react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { Button } from '@/components/ui/Button';
import { auth } from '@/lib/firebase';

export function EmailVerification() {
  const { isVerified, sendVerificationEmail } = useEmailVerification();
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Atualiza o email do usuário
    setUserEmail(auth.currentUser?.email || '');

    // Reseta o countdown quando o componente é montado
    setCountdown(0);
  }, []);

  useEffect(() => {
    // Gerencia o countdown para reenvio
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerification = async () => {
    try {
      setError('');
      await sendVerificationEmail();
      setEmailSent(true);
      setCountdown(60); // 60 segundos de espera para reenvio
      
      // Mostra mensagem de sucesso com o domínio do Firebase
      const domain = auth.currentUser?.email?.split('@')[1];
      if (domain) {
        const providers = [
          { domain: 'gmail.com', name: 'Gmail', link: 'https://gmail.com' },
          { domain: 'outlook.com', name: 'Outlook', link: 'https://outlook.live.com' },
          { domain: 'hotmail.com', name: 'Hotmail', link: 'https://outlook.live.com' },
          { domain: 'yahoo.com', name: 'Yahoo', link: 'https://mail.yahoo.com' }
        ];

        const provider = providers.find(p => domain.includes(p.domain));
        if (provider) {
          setError(`Email enviado! Clique aqui para abrir o ${provider.name}: ${provider.link}`);
        }
      }
    } catch (error: any) {
      // Usa a mensagem de erro personalizada do hook
      setError(error.message);
      setEmailSent(false);
      setCountdown(0);
    }
  };

  if (isVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Verificação de Email Necessária
          </h3>
          
          <div className="space-y-3">
            <p className="text-sm text-yellow-700">
              Para sua segurança, é necessário verificar seu email ({userEmail}) antes de acessar todas as funcionalidades do sistema.
            </p>

            <div className="bg-white bg-opacity-50 rounded p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Como verificar seu email:</p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Clique no botão abaixo para receber o email de verificação</li>
                <li>Verifique sua caixa de entrada (e pasta de spam)</li>
                <li>Clique no link de verificação no email</li>
                <li>Atualize esta página após verificar</li>
              </ol>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            {emailSent ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✅ Email de verificação enviado para {userEmail}
                </p>
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Aguarde {countdown} segundos para reenviar...
                  </p>
                ) : (
                  <Button
                    onClick={handleSendVerification}
                    variant="outline"
                    className="text-sm"
                  >
                    Reenviar email de verificação
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleSendVerification}
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 w-full justify-center py-2"
              >
                Enviar email de verificação
              </Button>
            )}

            <p className="text-xs text-gray-500 italic">
              Não recebeu o email? Verifique sua pasta de spam ou tente reenviar após 60 segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
