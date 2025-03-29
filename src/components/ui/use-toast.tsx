'use client';

import { useState, useEffect } from 'react';
import { toast as reactHotToast } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'loading' | 'info' | 'default';

interface ToastParams {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<string[]>([]);

  const toast = (params: ToastParams | string) => {
    const message = typeof params === 'string' ? params : params.message;
    const type = typeof params === 'string' ? 'default' : params.type || 'default';
    const duration = typeof params === 'string' ? 3000 : params.duration || 3000;

    // Adiciona o toast à lista
    setToasts((prev) => [...prev, message]);

    // Remove o toast após o tempo definido
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== message));
    }, duration);

    // Utiliza o react-hot-toast para exibir o toast
    switch (type) {
      case 'success':
        return reactHotToast.success(message, { duration });
      case 'error':
        return reactHotToast.error(message, { duration });
      case 'loading':
        return reactHotToast.loading(message, { duration });
      default:
        return reactHotToast(message, { duration });
    }
  };

  // Métodos específicos para tipos de toast
  toast.success = (message: string, duration?: number) => 
    toast({ message, type: 'success', duration });
  
  toast.error = (message: string, duration?: number) => 
    toast({ message, type: 'error', duration });
  
  toast.loading = (message: string, duration?: number) => 
    toast({ message, type: 'loading', duration });
  
  toast.dismiss = reactHotToast.dismiss;
  toast.remove = reactHotToast.remove;
  toast.custom = reactHotToast;

  return toast;
}

// Também exportamos um objeto toast para uso direto sem hooks
export const toast = {
  success: (message: string, duration?: number) => 
    reactHotToast.success(message, { duration }),
  
  error: (message: string, duration?: number) => 
    reactHotToast.error(message, { duration }),
  
  loading: (message: string, duration?: number) => 
    reactHotToast.loading(message, { duration }),
  
  info: (message: string, duration?: number) => 
    reactHotToast(message, { duration }),
  
  dismiss: reactHotToast.dismiss,
  remove: reactHotToast.remove,
  custom: reactHotToast
}; 