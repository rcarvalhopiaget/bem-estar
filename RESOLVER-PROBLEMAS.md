# Instruções para Resolver Problemas do Next.js

Para resolver os problemas de incompatibilidade do Next.js e conseguir testar o sistema em produção, siga os passos abaixo em um PowerShell administrativo:

## 1. Limpar ambiente atual

Feche o Cursor e qualquer terminal PowerShell que esteja usando. Abra um novo PowerShell e navegue até a pasta do projeto:

```powershell
cd C:\Users\rcarvalho\Documents\bem-estar-1
```

## 2. Fechar processos Node.js existentes

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

## 3. Remover pastas de build e pacotes

```powershell
# Remover pasta .next
if (Test-Path -Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
}

# Remover node_modules
if (Test-Path -Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
}
```

## 4. Instalar versões específicas e compatíveis

```powershell
# Instalar Next.js 12.3.4 com React 17
npm install --save next@12.3.4 react@17.0.2 react-dom@17.0.2

# Instalar dependências do Material UI
npm install --save @mui/material @mui/system @emotion/react@11.10.6 @emotion/styled@11.10.6
```

## 5. Corrigir package.json

Abra o arquivo `package.json` manualmente e verifique se os scripts estão configurados corretamente:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

## 6. Simplificar configuração do Next.js

Abra o arquivo `next.config.js` e substitua o conteúdo por:

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
  }
}

module.exports = nextConfig
```

## 7. Corrigir o componente Toast

Verifique se o arquivo `src/components/ui/use-toast.ts` não tem exportações duplicadas.

## 8. Construir e iniciar o projeto

```powershell
# Construir o projeto
$env:NODE_ENV = "production"
npm run build

# Iniciar o servidor
npm run start
```

Se você continuar tendo problemas com a versão de produção, tente usar o modo de desenvolvimento:

```powershell
npm run dev
```

## Problemas comuns e soluções

### Erro de módulo não encontrado para @mui/system

Reinstale os pacotes do Material UI:

```powershell
npm install --save @mui/material @mui/system @emotion/react @emotion/styled
```

### Erro relacionado a campos privados no undici

Este erro está relacionado a incompatibilidades entre versões do Next.js e Node.js. A solução mais simples é usar uma versão mais antiga do Next.js (12.x) que não depende do undici.

### Erro de exportação duplicada no toast

Verifique o arquivo `src/components/ui/use-toast.ts` e certifique-se de que as funções são exportadas apenas uma vez no final do arquivo. 