'use client';

import { useEmailVerification } from '@/hooks/useEmailVerification';

interface PermissionAlertProps {
  error: string;
}

export function PermissionAlert({ error }: PermissionAlertProps) {
  const { isVerified, sendVerificationEmail } = useEmailVerification();
  
  const isPermissionError = error.includes('Missing or insufficient permissions');
  
  if (!isPermissionError) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Você precisa verificar seu email para ter acesso completo ao sistema.
          </p>
          {!isVerified && (
            <button
              onClick={sendVerificationEmail}
              className="mt-2 px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Enviar email de verificação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
