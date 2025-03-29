import { toast as reactHotToast } from 'react-hot-toast';

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

export const toast = {
  success: (message: string) => reactHotToast.success(message),
  error: (message: string) => reactHotToast.error(message),
  info: (message: string) => reactHotToast(message),
  warning: (message: string) => reactHotToast(message),
  custom: reactHotToast,
  dismiss: reactHotToast.dismiss,
  remove: reactHotToast.remove,
  loading: reactHotToast.loading
}; 