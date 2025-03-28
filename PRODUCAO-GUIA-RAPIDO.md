# Guia Rápido para Deploy em Produção

Este guia fornece um passo a passo rápido para colocar o sistema BemEstar em produção.

## 1. Preparação

Certifique-se de que você tem:
- Node.js 18+ instalado
- NPM 9+ instalado
- PowerShell 5+ instalado
- Configurações do Firebase (chaves API e credenciais)
- Configurações de Email (SMTP, chaves API)
- URL de produção definida

## 2. Configuração Inicial

Execute o script de correção de case-sensitivity para evitar problemas de importação:

```powershell
./corrigir-toast.ps1
```

## 3. Configurar o Ambiente de Produção

Execute o script de configuração para preparar o ambiente:

```powershell
./setup-producao-win.ps1
```

Este script irá:
1. Fazer backup do arquivo `.env` atual
2. Aplicar as configurações de produção do arquivo `.env.production`
3. Limpar o cache do Next.js
4. Instalar as dependências
5. Construir a aplicação para produção

## 4. Verificar a Configuração

Execute o script de verificação para garantir que todas as variáveis estão configuradas corretamente:

```powershell
./verificar-producao.ps1
```

Certifique-se de que todas as verificações passaram sem erros.

## 5. Iniciar o Servidor em Produção

Execute o script para iniciar o servidor em modo de produção:

```powershell
./iniciar-producao.ps1
```

O servidor estará disponível na URL configurada no arquivo `.env`.

## 6. Verificações Pós-Deploy

Após iniciar o servidor, verifique:

- [ ] Login funciona corretamente
- [ ] Cadastro de alunos funciona
- [ ] Registro de refeições funciona
- [ ] Envio de emails funciona (teste com o botão de envio de teste)
- [ ] Todos os relatórios são gerados corretamente
- [ ] A aplicação está responsiva em dispositivos móveis

## Solução de Problemas

Se encontrar problemas, consulte o arquivo `DEPLOY.md` para instruções detalhadas de solução de problemas.

### Solução Rápida para Problemas de Dependências

Se você encontrar problemas com dependências ou erros de compilação, execute o script de resolução de dependências:

```powershell
./resolver-deps.ps1
```

Este script irá:
1. Limpar completamente as dependências e o cache
2. Corrigir o arquivo `next.config.js`
3. Instalar versões compatíveis do Next.js e React (13.5.6 e 18.2.0)
4. Instalar todas as dependências necessárias
5. Corrigir problemas de case-sensitivity
6. Gerar a build de produção

### Problemas Comuns e Soluções

#### 1. Erro "Module not found: Can't resolve '@mui/material' ou 'firebase/app'"

Isso indica que algumas dependências estão faltando:

```powershell
npm install @mui/material firebase --legacy-peer-deps
```

#### 2. Erro "Cannot find module '../lib/statuses'" ou erros similares em caniuse-lite

Atualizar o módulo caniuse-lite:

```powershell
npm i caniuse-lite@latest
```

#### 3. Erro com a pasta .next faltando ou incompleta

Use o script de limpeza e reconstrução completa:

```powershell
./limpar-e-reconstruir.ps1
```

Este script resolverá os seguintes problemas:
- Limpeza de cache e arquivos de compilação
- Correção de problemas de case-sensitivity
- Atualização do next.config.js
- Instalação de dependências que possam estar faltando

#### 4. Erro "Could not find a production build in the '.next' directory"

Este erro geralmente ocorre quando a compilação falha ou está incompleta. Execute:

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

#### 5. Erro "unhandledRejection: [Error: ENOENT: no such file or directory]"

Estes são problemas com o cache do webpack. Para resolver:

```powershell
Remove-Item -Recurse -Force .next/cache
npm run build
```

#### 6. Erro "Cannot find module 'next/dist/compiled/@napi-rs/triples'"

Este é um problema de incompatibilidade de versões entre o Next.js e suas dependências. Para resolver:

```powershell
# Remover node_modules e reinstalar com versões específicas
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install --legacy-peer-deps

# Se ainda não funcionar, tente instalar versões específicas
npm install next@13.5.6 react@18.2.0 react-dom@18.2.0 --legacy-peer-deps
```

#### 7. Erro "The module 'react' was not found"

Se você encontrar este erro mesmo após instalar as dependências, pode ser devido a problemas de cache. Execute:

```powershell
npm cache clean --force
npm install react react-dom --legacy-peer-deps
```

## Comandos Úteis

### Reiniciar o Servidor
```
Ctrl+C (para parar o servidor atual)
./iniciar-producao.ps1
```

### Limpar Cache e Reconstruir
```
Remove-Item -Recurse -Force .next
npm run build
```

### Verificar Portas em Uso
```
netstat -ano | findstr ":3000"
```

### Voltar para Ambiente de Desenvolvimento
```
Copy-Item -Path ".env.backup" -Destination ".env" -Force
npm run dev
``` 