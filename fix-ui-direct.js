const fs = require('fs');
const path = require('path');

console.log('=== Implementando solução direta para os componentes UI ===');

// Lista de arquivos e componentes com problemas
const problematicFiles = [
  {
    path: 'src/app/admin-restaurante/page.tsx',
    components: ['button', 'card']
  },
  {
    path: 'src/app/configuracoes/relatorios/page.tsx',
    components: ['button', 'input', 'card']
  }
];

// Mapear os componentes para seus conteúdos
const componentContents = {
  button: `// Componente Button embutido diretamente
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';`,

  card: `// Componente Card embutido diretamente
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';`,

  input: `// Componente Input embutido diretamente
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';`
};

// Função para criar o utilitário cn se não existir
function ensureCnUtilsExists() {
  const utilsDir = path.join(__dirname, 'src', 'lib');
  const utilsPath = path.join(utilsDir, 'utils.ts');
  
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
    console.log(`✅ Diretório lib criado: ${utilsDir}`);
  }
  
  if (!fs.existsSync(utilsPath)) {
    const cnUtilContent = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
    
    fs.writeFileSync(utilsPath, cnUtilContent, 'utf8');
    console.log(`✅ Criado arquivo de utilitários: ${utilsPath}`);
  }
}

// Função para modificar arquivos problemáticos
function fixFileImports() {
  // Primeiro, garantir que temos o utilitário cn
  ensureCnUtilsExists();
  
  // Para cada arquivo problemático
  problematicFiles.forEach(({ path: filePath, components }) => {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Para cada componente que precisa ser corrigido
    components.forEach(component => {
      // Remover a importação existente do componente
      const importRegex = new RegExp(`import\\s*{[^}]*}\\s*from\\s*['"]@/components/ui/${component}['"];?\\n?`, 'g');
      content = content.replace(importRegex, '');
      
      // Adicionar o conteúdo do componente no início do arquivo
      content = componentContents[component] + '\n\n' + content;
    });
    
    // Salvar o arquivo modificado
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Componentes embutidos no arquivo: ${filePath}`);
  });
}

// Executar a função principal
try {
  fixFileImports();
  console.log('\n=== Solução direta implementada com sucesso! ===');
  console.log('Os componentes UI foram embutidos diretamente nos arquivos que estavam apresentando problemas.');
  console.log('Isso deve resolver os erros relacionados a importações de componentes UI.');
} catch (error) {
  console.error('\n❌ Erro ao implementar solução direta:', error);
} 