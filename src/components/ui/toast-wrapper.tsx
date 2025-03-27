'use client';

// Re-exporta o componente toast e useToast para compatibilidade
import { useToast, toast } from '@/components/ui/use-toast';
export { useToast, toast };

// Também exporta os componentes de Toast por conveniência
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@/components/ui/toast'; 