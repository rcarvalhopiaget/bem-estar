# Guia de Deploy na Vercel

Este documento fornece instruções detalhadas para fazer deploy desta aplicação Next.js na Vercel.

## Pré-requisitos

1. Uma conta na Vercel: [vercel.com](https://vercel.com)
2. Repositório do projeto no GitHub, GitLab ou Bitbucket

## Correções Realizadas

Antes do deploy, foram realizadas as seguintes correções no projeto:

1. **Correção dos nomes dos componentes UI**
   - Os nomes dos arquivos de componentes foram padronizados para letra minúscula para corresponder às importações:
     - `Button.tsx` → `button.tsx`
     - `Card.tsx` → `card.tsx`
     - `Dialog.tsx` → `dialog.tsx`
     - `Input.tsx` → `input.tsx`
     - `Label.tsx` → `label.tsx`
     - `Toast.tsx` → `toast.tsx`
     - `Toaster.tsx` → `toaster.tsx`

2. **Correção das dependências do Firebase**
   - O arquivo `dataconnect-generated/js/default-connector/package.json` foi atualizado para aceitar a versão atual do Firebase:
     - De: `"firebase": "^11.3.0"`
     - Para: `"firebase": "^10.8.1"`

## Passos para Deploy na Vercel

### 1. Preparação do Repositório

Certifique-se de que todas as correções foram aplicadas e faça commit das alterações:

```bash
git add .
git commit -m "Fix: Prepare for Vercel deployment"
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
   - Adicione todas as variáveis listadas no arquivo `.env.production` com seus valores reais (não os placeholders)

5. Clique em "Deploy"

### 3. Verificação Pós-Deploy

Depois que o deploy for concluído, verifique:

1. **Funcionalidade do site**: Teste todas as funcionalidades principais
2. **Logs de erros**: Verifique os logs no dashboard da Vercel
3. **Performance**: Use as ferramentas de análise da Vercel para verificar o desempenho

## Solução de Problemas Comuns

### Erro: "Module not found: Can't resolve '@/components/ui/button'"

**Causa**: Incompatibilidade entre os nomes dos arquivos de componentes e as importações.

**Solução**: Renomeie os arquivos de componentes para letras minúsculas ou ajuste as importações para corresponder aos nomes dos arquivos.

### Erro: "Peer dependency conflict: firebase"

**Causa**: O pacote `@firebasegen/default-connector` espera uma versão diferente do Firebase.

**Solução**: Edite o arquivo `dataconnect-generated/js/default-connector/package.json` para aceitar a versão atual do Firebase.

### Erro: "Failed to fetch git submodules"

**Causa**: O repositório contém submódulos Git que não foram configurados corretamente.

**Solução**: Adicione os submódulos ao repositório ou remova as referências a eles.

## Configurações Avançadas

### Domínio Personalizado

1. No dashboard da Vercel, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar os registros DNS

### Integrações Contínuas (CI/CD)

Por padrão, a Vercel cria novos deploys para cada commit na branch principal. Você pode personalizar este comportamento em:

1. Dashboard do projeto > "Settings" > "Git"
2. Configure as branches para produção e preview

## Recursos Adicionais

- [Documentação da Vercel para Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Guia de Variáveis de Ambiente na Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Otimização de Performance na Vercel](https://vercel.com/docs/concepts/speed-insights) 