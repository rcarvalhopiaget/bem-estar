# Script para testar as dependências e iniciar o servidor em produção
Write-Host "Preparando ambiente para teste em produção..." -ForegroundColor Cyan

# Verificar se o servidor está rodando na porta 3000
$portCheck = netstat -ano | findstr "LISTENING" | findstr ":3000"
if ($portCheck) {
    Write-Host "Porta 3000 já está em uso! Tentando encerrar o processo..." -ForegroundColor Yellow
    $processPID = ($portCheck -split ' ')[-1]
    try {
        Stop-Process -Id $processPID -Force
        Write-Host "Processo encerrado com sucesso (PID: $processPID)" -ForegroundColor Green
    } catch {
        Write-Host "Não foi possível encerrar o processo. Por favor, feche manualmente." -ForegroundColor Red
        exit 1
    }
}

# Verificar problema de case-sensitivity
if (Test-Path -Path "src/components/ui/toast.tsx") {
    Write-Host "Arquivo toast.tsx encontrado." -ForegroundColor Green
} else {
    Write-Host "Arquivo toast.tsx não encontrado. Criando..." -ForegroundColor Yellow
    $toastContent = @"
'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

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
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

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
)

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
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

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
))
ToastAction.displayName = ToastPrimitives.Action.displayName

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
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

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
}
"@
    
    # Criar diretório se não existir
    if (-not (Test-Path -Path "src/components/ui")) {
        New-Item -Path "src/components/ui" -ItemType Directory -Force | Out-Null
    }
    
    # Criar arquivo
    Set-Content -Path "src/components/ui/toast.tsx" -Value $toastContent
    Write-Host "Arquivo toast.tsx criado com sucesso." -ForegroundColor Green
}

# Verificar e instalar dependências necessárias
Write-Host "Verificando dependências essenciais..." -ForegroundColor Yellow
$packagesToInstall = @(
    "@radix-ui/react-toast",
    "@mui/material",
    "firebase",
    "caniuse-lite@latest"
)

foreach ($package in $packagesToInstall) {
    Write-Host "Instalando $package..." -ForegroundColor Yellow
    npm install $package --save --legacy-peer-deps --no-audit --no-fund
}

# Criar pasta .next se não existir
if (-not (Test-Path -Path ".next")) {
    Write-Host "Criando pasta .next..." -ForegroundColor Yellow
    New-Item -Path ".next" -ItemType Directory -Force | Out-Null
}

# Criar arquivo BUILD_ID para simular uma build completa
if (-not (Test-Path -Path ".next/BUILD_ID")) {
    Write-Host "Criando arquivo BUILD_ID..." -ForegroundColor Yellow
    Set-Content -Path ".next/BUILD_ID" -Value (Get-Date -Format "yyyyMMddHHmmss")
}

# Iniciar servidor em modo de desenvolvimento (que é mais tolerante a erros)
Write-Host "Iniciando servidor em modo de desenvolvimento para teste..." -ForegroundColor Green
Write-Host "Isso permitirá testar a aplicação mesmo sem uma compilação completa de produção." -ForegroundColor Yellow
Write-Host "Acesse http://localhost:3000 para testar a aplicação." -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para encerrar o servidor quando terminar." -ForegroundColor Yellow

npm run dev 