# Procedimento de Testes para Deploy na Vercel

Este documento descreve os passos para testar localmente se a solução de módulos UI está funcionando corretamente antes de fazer o deploy na Vercel.

## 1. Verificação dos Componentes UI

### 1.1 Verificar a criação dos módulos UI

```bash
# Executar o script de criação de módulos UI
node create-ui-modules.js

# Verificar se os arquivos foram criados
ls -la src/components/ui/
```

A saída deve mostrar os seguintes arquivos:
- button.tsx
- card.tsx
- input.tsx
- switch.tsx

### 1.2 Verificar a existência do arquivo de utilitários

```bash
# Verificar se o arquivo utils.ts existe
ls -la src/lib/
```

O arquivo `utils.ts` deve estar presente no diretório `src/lib/`.

## 2. Verificação das Páginas Problemáticas

### 2.1 Corrigir importações nas páginas

```bash
# Executar o script de correção de importações
node fix-page-imports.js
```

### 2.2 Verificar manualmente os arquivos corrigidos

Abra os seguintes arquivos e verifique:
- `src/app/admin-restaurante/page.tsx`
- `src/app/configuracoes/relatorios/page.tsx`

Em cada arquivo, confirme que:
1. A diretiva `'use client'` está presente no início do arquivo
2. As importações dos componentes UI estão corretas (usando `@/components/ui/...`)
3. Não existem definições duplicadas de componentes

## 3. Verificação das Dependências

### 3.1 Instalar e verificar dependências necessárias

```bash
# Instalar dependências
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-switch

# Verificar se as dependências foram instaladas corretamente
grep -A 5 "dependencies" package.json
```

## 4. Verificação do Firebase Connector

### 4.1 Verificar a versão do Firebase no connector

```bash
# Verificar o arquivo package.json do connector
cat dataconnect-generated/js/default-connector/package.json | grep firebase
```

A versão do Firebase deve ser `^10.8.1` e não `^11.3.0`.

## 5. Verificação do Build Local

### 5.1 Executar o build localmente

```bash
# Limpar a pasta .next
rm -rf .next

# Executar o build
npm run build
```

O build deve ser concluído sem erros relacionados aos componentes UI.

### 5.2 Verificar o funcionamento local

```bash
# Iniciar o servidor local
npm run start
```

Acesse `http://localhost:3000` e navegue para as páginas problemáticas:
- `/admin-restaurante`
- `/configuracoes/relatorios`

Verifique se os componentes UI estão sendo renderizados corretamente.

## 6. Testes Adicionais (Opcional)

### 6.1 Simulação do ambiente Vercel

Se você tiver o pacote `vercel` instalado localmente, pode executar:

```bash
# Simulação do build da Vercel localmente
vercel build
```

### 6.2 Testar em um ambiente de staging

Se possível, faça um deploy para um ambiente de staging antes de atualizar a produção:

```bash
# Deploy para ambiente de staging
vercel
```

## 7. Lista de Verificação Final

- [ ] Todos os módulos UI foram criados
- [ ] As importações nas páginas problemáticas foram corrigidas
- [ ] O arquivo utils.ts existe
- [ ] Todas as dependências necessárias estão instaladas
- [ ] A versão do Firebase no connector está correta
- [ ] O build local foi concluído sem erros
- [ ] As páginas problemáticas funcionam corretamente no ambiente local
- [ ] O arquivo .vercelignore está configurado corretamente
- [ ] O arquivo vercel.json está configurado corretamente

Após concluir todos os testes com sucesso, você pode prosseguir com o deploy para a Vercel usando o script `deploy.sh`. 