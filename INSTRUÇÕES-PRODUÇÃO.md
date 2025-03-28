# Instruções para Testar o Sistema BemEstar em Produção

**Data:** 28/03/2025

## Preparação do Ambiente

Para testar o sistema BemEstar em ambiente de produção, siga os passos abaixo:

### 1. Correção das Dependências e Configurações

Abra um PowerShell e navegue até a pasta do projeto. Execute os seguintes comandos em sequência:

```powershell
# Parar quaisquer processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remover a pasta .next (se existir)
if (Test-Path -Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
}

# Instalar dependências específicas
npm install @mui/system @mui/material @emotion/react @emotion/styled react@18.2.0 react-dom@18.2.0 --save
```

### 2. Configuração do Next.js

Certifique-se de que o arquivo `next.config.js` esteja configurado da seguinte forma:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Melhorar compatibilidade com MUI e resolver problemas com undici
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/system': require.resolve('@mui/system'),
      '@mui/system/colorManipulator': require.resolve('@mui/system/colorManipulator'),
      'undici': false
    }
    
    return config;
  }
}

module.exports = nextConfig
```

### 3. Construção e Inicialização do Servidor

Para construir e iniciar o servidor em modo de produção:

```powershell
# Definir a variável de ambiente para produção
$env:NODE_ENV = "production"

# Construir o projeto
npm run build

# Iniciar o servidor
npm run start
```

## Solução de Problemas Comuns

### Erro no Material UI

Se você encontrar erros relacionados ao MUI como `Module not found: Can't resolve '@mui/system'`, execute:

```powershell
npm install @mui/system @mui/material --save
```

### Erro no Undici

Se você encontrar erros relacionados ao `undici` como:

```
Module parse failed: Unexpected token (860:57)
```

Certifique-se de que a configuração do webpack no `next.config.js` inclui `'undici': false` e que você está usando uma versão específica do Next.js (13.4.12).

### Erro no Toast

Se encontrar erros relacionados a exportações duplicadas no Toast:

1. Verifique o arquivo `src/components/ui/use-toast.ts`
2. Certifique-se de que não há exportações duplicadas
3. Use uma única declaração de exportação no final do arquivo

## Verificação do Sistema

Após iniciar o servidor, acesse:

- http://localhost:3000

O sistema deve carregar sem erros. Teste todas as funcionalidades principais, especialmente aquelas que utilizam notificações toast e componentes do Material UI. 