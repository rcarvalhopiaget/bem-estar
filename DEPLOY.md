# Guia de Deploy para Produção - Sistema BemEstar

Este documento fornece instruções detalhadas para realizar o deploy do Sistema BemEstar em ambiente de produção.

## Pré-requisitos

- Node.js 18.x ou superior
- NPM 9.x ou superior
- PowerShell 5.x ou superior
- Conta no Firebase com projeto configurado
- Conta no Vercel (se for deployar na plataforma Vercel)

## Opções de Deploy

### 1. Deploy Local (Servidor Node.js)

Para realizar o deploy em um servidor Node.js próprio:

1. Execute o script de configuração da produção:

```powershell
./setup-producao-win.ps1
```

2. Inicie o servidor em modo de produção:

```powershell
npm run start
```

O servidor estará disponível na porta 3000 por padrão. Para alterar a porta, defina a variável de ambiente `PORT`:

```powershell
$env:PORT=8080; npm run start
```

### 2. Deploy na Vercel

Para realizar o deploy na plataforma Vercel:

1. Certifique-se de ter as credenciais da Vercel configuradas localmente:

```bash
npx vercel login
```

2. Execute o comando de deploy:

```bash
npm run deploy
```

Alternativamente, você pode configurar o deploy automático conectando o repositório GitHub ao projeto na Vercel.

## Variáveis de Ambiente Essenciais

Certifique-se de que as seguintes variáveis estão configuradas corretamente no arquivo `.env.production`:

- `NEXT_PUBLIC_APP_URL`: URL completa da aplicação em produção
- `NEXTAUTH_URL`: Deve ser o mesmo valor de `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_SECRET`: Chave secreta para autenticação

Para verificar a configuração das variáveis de ambiente, execute:

```powershell
./verificar-producao.ps1
```

## Verificações Pós-Deploy

Após o deploy, verifique se:

1. A autenticação está funcionando corretamente
2. As permissões do Firestore estão configuradas adequadamente
3. O envio de emails está operacional
4. A aplicação está acessível através da URL de produção

## Solução de Problemas

### Problemas Comuns

#### 1. Erro de Compilação com Case Sensitivity

No Windows, o sistema de arquivos não diferencia maiúsculas de minúsculas, mas o Next.js e o TypeScript sim. Isso pode causar erros como:

```
Already included file name 'toast.tsx' differs from file name 'Toast.tsx' only in casing.
```

Solução: Use o script de correção para uniformizar os nomes dos arquivos:

```powershell
./corrigir-toast.ps1
```

#### 2. Erro de Permissão ao Acessar o Firestore

Se você encontrar erros como "permission-denied" ao tentar acessar o Firestore:

1. Verifique se as regras de segurança do Firestore estão configuradas corretamente
2. Confirme se o SDK do Firebase Admin está configurado com as credenciais corretas
3. Certifique-se de que o usuário está autenticado antes de tentar acessar recursos protegidos

#### 3. Emails não estão sendo enviados

Se os emails não estiverem sendo enviados:

1. Verifique se as credenciais do serviço de email estão corretas em `.env`
2. Teste a funcionalidade de envio de teste no painel administrativo
3. Verifique os logs do servidor para mensagens de erro relacionadas ao envio de emails

#### 4. Erros de Caching do Next.js

Se encontrar erros relacionados ao cache do Next.js:

```
Error: ENOENT: no such file or directory, stat 'C:\path\to\.next\cache\...'
```

Solução: Limpe a pasta `.next` completamente:

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

### Ferramentas de Diagnóstico

O sistema inclui as seguintes ferramentas para diagnosticar problemas:

1. **verificar-producao.ps1**: Verifica se todas as variáveis de ambiente necessárias estão configuradas corretamente
2. **corrigir-toast.ps1**: Corrige problemas de case sensitivity nos componentes UI
3. **setup-producao-win.ps1**: Configura o ambiente para produção, incluindo limpeza de cache

## Contato

Para suporte adicional, entre em contato com a equipe de desenvolvimento em `suporte@bemestar.com`. 