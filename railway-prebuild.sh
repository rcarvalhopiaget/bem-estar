#!/bin/bash

echo "===== Railway Prebuild Script ====="
echo "Verificando ambiente..."

# Verificar versões
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# Verificar diretórios importantes
echo "Estrutura de diretórios:"
find . -type d -maxdepth 2 | sort
echo ""

# Verificar arquivos de configuração
echo "Arquivos de configuração:"
ls -la *.json *.js 2>/dev/null || echo "Nenhum arquivo de configuração encontrado"
echo ""

# Verificar se o next.config.js existe e mostrar seu conteúdo
if [ -f "next.config.js" ]; then
  echo "Conteúdo do next.config.js:"
  cat next.config.js
  echo ""
else
  echo "ERRO: next.config.js não encontrado!"
  exit 1
fi

# Verificar src/components/ui/alert.tsx
if [ -f "src/components/ui/alert.tsx" ]; then
  echo "alert.tsx existe"
else
  echo "ERRO: src/components/ui/alert.tsx não encontrado!"
  mkdir -p src/components/ui
  echo 'import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500",
        warning: 
          "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-500",
        info:
          "border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };' > src/components/ui/alert.tsx
  echo "alert.tsx criado automaticamente"
fi

# Verificar src/lib/utils.ts
if [ -f "src/lib/utils.ts" ]; then
  echo "utils.ts existe"
else
  echo "ERRO: src/lib/utils.ts não encontrado!"
  mkdir -p src/lib
  echo 'import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}' > src/lib/utils.ts
  echo "utils.ts criado automaticamente"
fi

# Preparar ambiente
echo "Limpando caches..."
rm -rf .next
rm -rf node_modules/.cache

echo "===== Prebuild concluído ====="
exit 0 