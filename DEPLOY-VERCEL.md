# Guia de Deploy na Vercel

Este documento fornece instruções detalhadas para atualizar o repositório GitHub e fazer o deploy do projeto BemEstar na Vercel.

## Índice
1. [Preparação do Código](#1-preparação-do-código)
2. [Atualização no GitHub](#2-atualização-no-github)
3. [Deploy na Vercel](#3-deploy-na-vercel)
4. [Configurações Adicionais](#4-configurações-adicionais)
5. [Solucionando Problemas Comuns](#5-solucionando-problemas-comuns)

## 1. Preparação do Código

Antes de enviar o código para o GitHub e fazer o deploy na Vercel, é importante preparar adequadamente o projeto:

### 1.1. Execute o Script de Preparação

Execute o script de preparação incluído no projeto:

```powershell
./preparar-deploy.ps1
```

Este script irá:
- Encerrar processos Node.js em execução
- Limpar a pasta `.next`
- Verificar a configuração do Next.js
- Verificar o arquivo `.gitignore`

### 1.2. Verifique as Dependências

Certifique-se de que as dependências estão corretamente especificadas no `package.json`. Você pode verificar as dependências com:

```bash
npm list --depth=0
```

### 1.3. Verifique o arquivo `next.config.js`

O arquivo `next.config.js` deve estar configurado da seguinte forma:

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

## 2. Atualização no GitHub

### 2.1. Configure o Git (se ainda não estiver configurado)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 2.2. Inicialize o Repositório (se necessário)

Se o repositório ainda não estiver inicializado:

```bash
git init
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
```

### 2.3. Adicione e Confirme as Alterações

```bash
git add .
git commit -m "Preparação para deploy na Vercel"
```

### 2.4. Envie para o GitHub

```bash
git push origin main
```

Se você estiver usando outra branch, substitua `main` pelo nome da sua branch.

## 3. Deploy na Vercel

### 3.1. Acesse a Vercel

1. Visite [https://vercel.com/](https://vercel.com/)
2. Faça login com sua conta (você pode criar uma ou usar login com GitHub)

### 3.2. Importe o Projeto

1. Clique em "Add New..." > "Project"
2. Selecione o repositório GitHub que contém o projeto BemEstar
3. Clique em "Import"

### 3.3. Configure o Projeto

Na tela de configuração:

1. **Framework Preset**: Selecione "Next.js"
2. **Root Directory**: Deixe como `/` (raiz do projeto)
3. **Build Command**: Deixe o padrão `next build`
4. **Output Directory**: Deixe o padrão `.next`

### 3.4. Variáveis de Ambiente

Adicione todas as variáveis de ambiente necessárias. Se você tiver um arquivo `.env.example`, use-o como referência.

Variáveis importantes para o projeto BemEstar:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3.5. Inicie o Deploy

Clique no botão "Deploy" e aguarde a conclusão do processo.

## 4. Configurações Adicionais

### 4.1. Domínio Personalizado (Opcional)

1. Na dashboard do projeto, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado e siga as instruções

### 4.2. Configurações de Analytics (Opcional)

1. Na dashboard do projeto, vá para "Settings" > "Analytics"
2. Configure as opções de analytics conforme necessário

## 5. Solucionando Problemas Comuns

### 5.1. Problemas de Build

Se o build falhar na Vercel, verifique os logs de build e procure por erros específicos:

1. Na dashboard do projeto, clique na implantação com falha
2. Vá para a guia "Logs"
3. Examine os logs para identificar o problema

### 5.2. Erros de Módulo não Encontrado

Se ocorrerem erros como "Module not found":

1. Verifique se todas as dependências estão corretamente listadas no `package.json`
2. Certifique-se de que não há referências a módulos que são usados apenas em desenvolvimento

### 5.3. Erros Relacionados a Imagens

Se houver problemas com imagens:

1. Verifique se o domínio está corretamente configurado em `next.config.js`
2. Certifique-se de que está usando o componente `Image` do Next.js corretamente

### 5.4. Problemas com Material UI (MUI)

Se encontrar problemas relacionados ao MUI:

1. Verifique se todas as dependências do MUI estão instaladas:
   ```bash
   npm install @mui/material @mui/system @emotion/react @emotion/styled
   ```

2. Certifique-se de que o tema do MUI está configurado corretamente

### 5.5. Problemas com Toast Notifications

Se as notificações toast não funcionarem:

1. Verifique o arquivo `src/hooks/use-toast.ts` para garantir que não há exportações duplicadas
2. Certifique-se de que o provedor de toast está configurado corretamente no layout principal

---

## Verificação Pós-Deploy

Após o deploy ser concluído com sucesso:

1. Acesse o URL fornecido pela Vercel
2. Teste todas as funcionalidades principais do aplicativo
3. Verifique se as notificações toast funcionam corretamente
4. Teste o aplicativo em diferentes dispositivos e navegadores

Se encontrar problemas após o deploy, você pode reverter para uma versão anterior na dashboard da Vercel ou fazer correções e implantar novamente.

## Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Guia de Deploy do Next.js](https://nextjs.org/docs/deployment) 