const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar e criar tsconfig.tsbuildinfo vazio se não existir
console.log('🔍 Verificando tsconfig.tsbuildinfo...');
if (!fs.existsSync('./.next/tsconfig.tsbuildinfo')) {
  try {
    // Criar diretório .next se não existir
    if (!fs.existsSync('./.next')) {
      fs.mkdirSync('./.next', { recursive: true });
    }
    fs.writeFileSync('./.next/tsconfig.tsbuildinfo', '{}');
    console.log('✅ tsconfig.tsbuildinfo criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tsconfig.tsbuildinfo:', error);
  }
}

// Garantir que as pastas src/ existam
if (!fs.existsSync('./src')) {
  fs.mkdirSync('./src', { recursive: true });
}

// Garantir que o arquivo global.css exista
console.log('🔍 Verificando arquivo global.css...');
if (!fs.existsSync('./src/app/globals.css')) {
  try {
    // Garantir que o diretório app exista
    if (!fs.existsSync('./src/app')) {
      fs.mkdirSync('./src/app', { recursive: true });
    }

    const globalCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
 
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;
    fs.writeFileSync('./src/app/globals.css', globalCssContent);
    console.log('✅ globals.css criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar globals.css:', error);
  }
}

// Verificar e criar pasta contexts se não existir
console.log('🔍 Verificando diretório contexts...');
if (!fs.existsSync('./src/contexts')) {
  try {
    fs.mkdirSync('./src/contexts', { recursive: true });
    console.log('✅ Diretório contexts criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar diretório contexts:', error);
  }
}

// Criar AuthContext.tsx se não existir
console.log('🔍 Verificando AuthContext.tsx...');
if (!fs.existsSync('./src/contexts/AuthContext.tsx')) {
  try {    
    // Criar AuthContext.tsx básico
    const authContextContent = `'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulação de verificação de autenticação
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Implementação básica para o build
    return { user: { email } };
  };

  const signOut = async () => {
    // Implementação básica para o build
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`;
    
    fs.writeFileSync('./src/contexts/AuthContext.tsx', authContextContent);
    console.log('✅ AuthContext.tsx criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar AuthContext:', error);
  }
}

// Verificar e criar lib diretório e utils.ts
console.log('🔍 Verificando diretório lib...');
if (!fs.existsSync('./src/lib')) {
  try {
    fs.mkdirSync('./src/lib', { recursive: true });
    console.log('✅ Diretório lib criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar diretório lib:', error);
  }
}

console.log('🔍 Verificando utils.ts...');
if (!fs.existsSync('./src/lib/utils.ts')) {
  try {
    const utilsContent = `import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
    fs.writeFileSync('./src/lib/utils.ts', utilsContent);
    console.log('✅ utils.ts criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar utils.ts:', error);
  }
}

// Verificar e criar componentes UI se não existirem
console.log('🔍 Verificando componentes UI...');

// Verificar e criar pasta UI
console.log('🔍 Verificando diretório components/ui...');
if (!fs.existsSync('./src/components/ui')) {
  try {
    // Garantir que o diretório components exista
    if (!fs.existsSync('./src/components')) {
      fs.mkdirSync('./src/components', { recursive: true });
    }
    fs.mkdirSync('./src/components/ui', { recursive: true });
    console.log('✅ Diretório components/ui criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar diretório components/ui:', error);
  }
}

// Componente button
console.log('🔍 Verificando button.tsx...');
if (!fs.existsSync('./src/components/ui/button.tsx')) {
  try {
    const buttonContent = `'use client';
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
`;
    fs.writeFileSync('./src/components/ui/button.tsx', buttonContent);
    console.log('✅ button.tsx criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar button.tsx:', error);
  }
}

// Componente card
console.log('🔍 Verificando card.tsx...');
if (!fs.existsSync('./src/components/ui/card.tsx')) {
  try {
    const cardContent = `'use client';
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
`;
    fs.writeFileSync('./src/components/ui/card.tsx', cardContent);
    console.log('✅ card.tsx criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar card.tsx:', error);
  }
}

// Componente input
console.log('🔍 Verificando input.tsx...');
if (!fs.existsSync('./src/components/ui/input.tsx')) {
  try {
    const inputContent = `'use client';
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
`;
    fs.writeFileSync('./src/components/ui/input.tsx', inputContent);
    console.log('✅ input.tsx criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar input.tsx:', error);
  }
}

// Criar arquivos Tailwind necessários
console.log('🔍 Verificando arquivos de configuração do Tailwind...');

// Verificar e criar postcss.config.js
if (!fs.existsSync('./postcss.config.js')) {
  try {
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    fs.writeFileSync('./postcss.config.js', postcssConfig);
    console.log('✅ postcss.config.js criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar postcss.config.js:', error);
  }
}

// Verificar e criar tailwind.config.js
if (!fs.existsSync('./tailwind.config.js')) {
  try {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
`;
    fs.writeFileSync('./tailwind.config.js', tailwindConfig);
    console.log('✅ tailwind.config.js criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tailwind.config.js:', error);
  }
}

// Criar/modificar gitignore para ignorar node_modules
if (!fs.existsSync('./.gitignore')) {
  try {
    fs.writeFileSync('./.gitignore', `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`);
    console.log('✅ .gitignore criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar .gitignore:', error);
  }
}

// Instalar dependências de produção
console.log('📦 Instalando dependências de produção (pode demorar um pouco)...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error);
}

// Executar o build do Next.js com NODE_ENV=production para garantir que as dependências corretas sejam usadas
console.log('🔨 Executando build do Next.js...');
try {
  execSync('NODE_ENV=production next build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o build:', error);
  process.exit(1);
} 