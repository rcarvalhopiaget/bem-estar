'use client';

import { toast as reactHotToast } from 'react-hot-toast';
import { useToast } from '@/components/ui/toast';
import { ToastProps, ToastActionElement } from '@/components/ui/toast';

// Re-exportar os tipos
export type { ToastProps, ToastActionElement };

// Exportar toast para compatibilidade com componentes que usam react-hot-toast
export const toast = reactHotToast;

// Função auxiliar para exibir mensagens de toast (compatibilidade com pm)
export const pm = (message: string, options?: { type?: 'success' | 'error' | 'warning' | 'info' }) => {
  if (options?.type === 'error') {
    return reactHotToast.error(message);
  }
  if (options?.type === 'success') {
    return reactHotToast.success(message);
  }
  return reactHotToast(message);
};

// Exportar uma função toast compatível caso não esteja usando react-hot-toast
export const toastSimple = (message: string, options?: { type?: 'success' | 'error' | 'warning' | 'info' }) => {
  if (options?.type === 'error') {
    return reactHotToast.error(message);
  }
  if (options?.type === 'success') {
    return reactHotToast.success(message);
  }
  return reactHotToast(message);
};

export { useToast }; 