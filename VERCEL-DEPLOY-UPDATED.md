# Guia Atualizado de Deploy na Vercel

Este documento fornece instruções detalhadas para fazer deploy desta aplicação Next.js na Vercel, usando a nova abordagem com módulos UI separados.

## Pré-requisitos

1. Uma conta na Vercel: [vercel.com](https://vercel.com)
2. Repositório do projeto no GitHub, GitLab ou Bitbucket
3. Node.js e npm instalados localmente

## Abordagem de Solução

A solução implementada para resolver os problemas de deploy segue estas etapas:

1. **Criação de módulos separados para componentes UI**
   - Em vez de embutir os componentes UI diretamente nos arquivos que os utilizam, criamos arquivos separados para cada componente
   - Cada componente é marcado com `'use client'` para garantir compatibilidade com o Next.js 
   - Os componentes são colocados no diretório `src/components/ui/`

2. **Padronização das importações nos arquivos problemáticos**
   - As importações de componentes UI são atualizadas para usar a nova estrutura modular
   - Adicionamos a diretiva `'use client'` aos arquivos que utilizam esses componentes

3. **Instalação automática de dependências necessárias**
   - Verifica e instala as dependências necessárias para os componentes UI
   - Inclui clsx, tailwind-merge, class-variance-authority e @radix-ui/react-switch

4. **Correção de compatibilidade do Firebase**
   - Atualiza a versão necessária do Firebase no conector para compatibilidade

## Como Usar os Scripts de Preparação

Todos os passos de preparação foram automatizados em scripts. Para preparar o projeto para deploy:

```bash
# Executar o script principal de preparação
node vercel-deploy.js

# Ou executar cada etapa individualmente
node create-ui-modules.js     # Cria os módulos de componentes UI
node fix-page-imports.js      # Corrige as importações nas páginas
```

## Passos para Deploy na Vercel

### 1. Preparação do Repositório

```bash
# Executar o script de preparação
node vercel-deploy.js

# Commit e push das alterações
git add .
git commit -m "Fix: Solução com módulos UI separados"
git push
```

### 2. Deploy via Interface Web da Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe seu repositório
3. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build (já definido no vercel.json)
   - **Install Command**: npm install (já definido no vercel.json)

4. Configure as variáveis de ambiente:
   - Clique em "Environment Variables"
   - Adicione todas as variáveis listadas no arquivo `.env.production` com seus valores reais

5. Clique em "Deploy"

### 3. Deploy via CLI (Opcional)

```bash
# Instalar a CLI da Vercel (se ainda não estiver instalada)
npm install -g vercel

# Login na Vercel
vercel login

# Deploy do projeto
vercel --prod

# Ou usar o script de deploy preparado
bash deploy.sh
```

### 4. Verificação Pós-Deploy

1. **Funcionalidade do site**: Teste todas as funcionalidades principais
2. **Logs de erros**: Verifique os logs no dashboard da Vercel
3. **Performance**: Use as ferramentas de análise da Vercel para verificar o desempenho

## Arquivos de Configuração

### .vercelignore

Este arquivo define quais arquivos serão ignorados durante o deploy:

```
# Ignorar arquivos relacionados a submódulos Git
.git
.gitmodules

# Ignorar arquivos desnecessários para o build
node_modules
.github
.vscode

# Ignorar scripts de desenvolvimento
*.ps1
fix-ui-components.js
fix-imports.js
fix-ui-imports.js
patch-imports.js
prepare-vercel-deploy.js
fix-ui-direct.js
create-ui-modules.js
fix-page-imports.js
```

### vercel.json

Este arquivo define as configurações de build e deploy para a Vercel:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "devCommand": "npm run dev",
  "cleanUrls": true,
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "${NEXT_PUBLIC_FIREBASE_API_KEY}",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
    "NEXT_PUBLIC_FIREBASE_APP_ID": "${NEXT_PUBLIC_FIREBASE_APP_ID}",
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID": "${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}",
    "EMAIL_USER": "${EMAIL_USER}",
    "EMAIL_PASSWORD": "${EMAIL_PASSWORD}",
    "EMAIL_SMTP_HOST": "${EMAIL_SMTP_HOST}",
    "EMAIL_SMTP_PORT": "${EMAIL_SMTP_PORT}",
    "EMAIL_FROM": "${EMAIL_FROM}",
    "EMAIL_TEST_MODE": "${EMAIL_TEST_MODE}",
    "NEXT_PUBLIC_API_URL": "${NEXT_PUBLIC_API_URL}",
    "NEXT_PUBLIC_APP_URL": "${NEXT_PUBLIC_APP_URL}",
    "SESSION_SECRET": "${SESSION_SECRET}",
    "NEXT_PUBLIC_CACHE_TTL": "${NEXT_PUBLIC_CACHE_TTL}",
    "NEXT_PUBLIC_CACHE_MAX_AGE": "${NEXT_PUBLIC_CACHE_MAX_AGE}"
  }
}
```

## Solução de Problemas

### Erro: "Module not found: Can't resolve '@/components/ui/...'"

**Causa**: Os componentes UI não foram criados ou não estão sendo importados corretamente.

**Solução**: 
1. Execute `node create-ui-modules.js` para criar os módulos de componentes UI
2. Execute `node fix-page-imports.js` para corrigir as importações

### Erro: "Peer dependency conflict: firebase"

**Causa**: Versões incompatíveis do Firebase.

**Solução**: 
O script `vercel-deploy.js` já corrige este problema, mas você também pode verificar manualmente o arquivo `dataconnect-generated/js/default-connector/package.json`.

### Erro: "Failed to fetch git submodules"

**Causa**: Referências a submódulos Git não configurados.

**Solução**: 
O arquivo `.vercelignore` configurado resolve este problema ignorando arquivos relacionados a submódulos Git.

## Recursos Adicionais

- [Documentação da Vercel para Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Guia de Variáveis de Ambiente na Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Otimização de Performance na Vercel](https://vercel.com/docs/concepts/speed-insights) 