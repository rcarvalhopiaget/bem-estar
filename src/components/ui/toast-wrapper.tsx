'use client';

import { toast as reactHotToast } from 'react-hot-toast';
import { useToast as shadcnUseToast } from '@/components/ui/use-toast';
import { Toast, ToastProps } from '@/components/ui/toast';

// Re-exportar os componentes originais
export { Toast };
export type { ToastProps };

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

// Também exporta os componentes de Toast por conveniência
export {
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@/components/ui/toast'; 



