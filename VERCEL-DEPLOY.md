# Guia de Deploy na Vercel

Este documento fornece instruções detalhadas para fazer deploy desta aplicação Next.js na Vercel.

## Pré-requisitos

1. Uma conta na Vercel: [vercel.com](https://vercel.com)
2. Repositório do projeto no GitHub, GitLab ou Bitbucket

## Correções Implementadas

Antes do deploy, foram implementadas as seguintes correções no projeto:

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

3. **Criação de barrel files para compatibilidade entre sistemas de arquivos**
   - Foram criados arquivos de barril (barrel files) para cada componente UI, o que resolve problemas de case-sensitivity entre Windows (case-insensitive) e Linux/Vercel (case-sensitive).

4. **Correção das importações nos arquivos**
   - As importações de componentes UI foram padronizadas em todo o projeto para usar a forma minúscula, evitando problemas de importação durante o build.

5. **Configuração do .vercelignore**
   - Foi criado um arquivo `.vercelignore` para excluir arquivos desnecessários do deploy, melhorando a performance e evitando problemas relacionados a submódulos Git.

## Como Usar as Correções

Todas as correções foram automatizadas em um único script. Para aplicá-las antes do deploy, execute:

```bash
node prepare-vercel-deploy.js
```

Este script:
- Renomeia os componentes UI para minúsculas
- Cria barrel files para compatibilidade entre sistemas de arquivos
- Corrige importações nos arquivos TypeScript/TSX
- Atualiza a dependência do Firebase no connector
- Configura o arquivo .vercelignore
- Verifica o arquivo vercel.json

## Passos para Deploy na Vercel

### 1. Preparação do Repositório

Certifique-se de que todas as correções foram aplicadas e faça commit das alterações:

```bash
# Executar o script de preparação para deploy
node prepare-vercel-deploy.js

# Commit e push das alterações
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

### 3. Deploy via CLI (Opcional)

Se preferir usar a CLI da Vercel:

```bash
# Instalar a CLI da Vercel
npm install -g vercel

# Login na Vercel
vercel login

# Deploy do projeto
vercel --prod

# Ou use o script preparado
./deploy.sh
```

### 4. Verificação Pós-Deploy

Depois que o deploy for concluído, verifique:

1. **Funcionalidade do site**: Teste todas as funcionalidades principais
2. **Logs de erros**: Verifique os logs no dashboard da Vercel
3. **Performance**: Use as ferramentas de análise da Vercel para verificar o desempenho

## Solução de Problemas Comuns

### Erro: "Module not found: Can't resolve '@/components/ui/button'"

**Causa**: Incompatibilidade entre os nomes dos arquivos de componentes e as importações, geralmente devido à diferença de case-sensitivity entre sistemas de arquivos.

**Solução**: 
1. Execute o script `prepare-vercel-deploy.js` para aplicar todas as correções necessárias
2. Verifique as importações nos arquivos problemáticos manualmente

### Erro: "Peer dependency conflict: firebase"

**Causa**: O pacote `@firebasegen/default-connector` espera uma versão diferente do Firebase.

**Solução**: O script de preparação já corrige esta dependência, mas você pode verificar manualmente o arquivo `dataconnect-generated/js/default-connector/package.json`.

### Erro: "Failed to fetch git submodules"

**Causa**: O repositório contém referências a submódulos Git que não foram configurados corretamente.

**Solução**: 
1. O arquivo `.vercelignore` já configurado deve resolver este problema
2. Se persistir, verifique se existem referências a submódulos no arquivo `.gitmodules` e remova-as

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