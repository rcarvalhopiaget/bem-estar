'use client';

import { toast as reactHotToast } from 'react-hot-toast';
import { useToast as shadcnUseToast, ToastProps, ToastActionElement } from '@/components/ui/use-toast';

// Re-exportar os tipos
export type { ToastProps, ToastActionElement };

// Exportar useToast para componentes que usam shadcn/ui
export const useToast = shadcnUseToast;

// Exportar toast para componentes que usam react-hot-toast
export const toast = reactHotToast;

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



