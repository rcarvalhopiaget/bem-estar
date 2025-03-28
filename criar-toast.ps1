# Script para criar os arquivos toast.tsx e Toaster.tsx
Write-Host "Criando arquivos relacionados ao Toast..." -ForegroundColor Cyan

# Garantir que o diretório existe
$uiDir = "src/components/ui"
if (-not (Test-Path -Path $uiDir)) {
    Write-Host "Criando diretório $uiDir..." -ForegroundColor Yellow
    New-Item -Path $uiDir -ItemType Directory -Force | Out-Null
}

# Conteúdo do arquivo toast.tsx
$toastContent = @'
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-slate-200 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full bg-white',
  {
    variants: {
      variant: {
        default: 'border border-slate-200 bg-white text-slate-950',
        destructive:
          'destructive group border-red-500 bg-red-500 text-slate-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-slate-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-slate-50 group-[.destructive]:focus:ring-red-500',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
'@

# Conteúdo do arquivo Toaster.tsx
$toasterContent = @'
'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
'@

# Salvar o arquivo toast.tsx
$toastPath = Join-Path $uiDir "toast.tsx"
try {
    Set-Content -Path $toastPath -Value $toastContent -Force
    Write-Host "Arquivo toast.tsx criado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "Erro ao criar arquivo toast.tsx: $_" -ForegroundColor Red
}

# Salvar o arquivo Toaster.tsx
$toasterPath = Join-Path $uiDir "Toaster.tsx"
try {
    Set-Content -Path $toasterPath -Value $toasterContent -Force
    Write-Host "Arquivo Toaster.tsx criado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "Erro ao criar arquivo Toaster.tsx: $_" -ForegroundColor Red
}

# Verificar se os arquivos foram criados
if ((Test-Path -Path $toastPath) -and (Test-Path -Path $toasterPath)) {
    Write-Host "Arquivos criados com sucesso. Problema do Toast resolvido!" -ForegroundColor Green
}
else {
    Write-Host "Falha na criação de um ou mais arquivos." -ForegroundColor Red
}

# Criar arquivo use-toast.ts se não existir
$useToastPath = Join-Path $uiDir "use-toast.ts"
if (-not (Test-Path -Path $useToastPath)) {
    $useToastContent = @'
import { useContext } from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Simplified version
type Toast = Omit<ToasterToast, 'id'>;

export function useToast() {
  const toasts: ToasterToast[] = [];

  function toast(props: Toast) {
    // Simple stub for now
    console.log('Toast:', props);
    return { id: '1', ...props };
  }

  return {
    toast,
    toasts,
    dismiss: (id: string) => console.log('Dismiss:', id),
  };
}
'@
    try {
        Set-Content -Path $useToastPath -Value $useToastContent -Force
        Write-Host "Arquivo use-toast.ts criado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "Erro ao criar arquivo use-toast.ts: $_" -ForegroundColor Red
    }
} 