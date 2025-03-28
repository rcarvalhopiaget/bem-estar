# Instruções para Enviar o Projeto BemEstar para o GitHub

Se você está enfrentando problemas com os scripts PowerShell, siga estas instruções passo a passo para enviar seu código ao GitHub manualmente.

## Pré-requisitos

- Git instalado no seu computador
- Conta no GitHub
- Repositório criado no GitHub

## Passos Detalhados

### 1. Abra um novo terminal PowerShell ou Command Prompt

Abra um novo terminal e navegue até a pasta do projeto:

```bash
cd C:\Users\rcarvalho\Documents\bem-estar-1
```

### 2. Configure seu nome e email no Git (se ainda não tiver feito)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 3. Inicialize o Git no projeto (se ainda não estiver inicializado)

```bash
git init
```

### 4. Verifique o status dos arquivos

```bash
git status
```

### 5. Adicione todos os arquivos ao staging

```bash
git add .
```

### 6. Crie um commit com suas mudanças

```bash
git commit -m "Projeto BemEstar pronto para deploy na Vercel"
```

### 7. Adicione o repositório remoto

Substitua `seu-usuario` e `seu-repositorio` pelos seus dados do GitHub:

```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
```

Se o repositório remoto já estiver configurado e você precisar atualizá-lo:

```bash
git remote set-url origin https://github.com/seu-usuario/seu-repositorio.git
```

### 8. Envie seu código para o GitHub

```bash
git push -u origin main
```

Se você estiver usando uma branch diferente (por exemplo, "master"):

```bash
git push -u origin master
```

## Solução de Problemas

### Se o push for rejeitado devido a mudanças remotas

Se você receber um erro como "Updates were rejected because the remote contains work that you do not have locally", tente:

```bash
git pull --rebase origin main
git push origin main
```

### Se você precisar forçar o push (use com cautela)

**ATENÇÃO**: Use apenas se você tem certeza que deseja sobrescrever o histórico remoto:

```bash
git push -f origin main
```

### Se você receber erros de autenticação

Se o GitHub solicitar autenticação, forneça seu nome de usuário e senha do GitHub. 

**Nota**: Se você tem autenticação de dois fatores ativada, precisará usar um token de acesso pessoal em vez de sua senha. Veja como criar um:
1. Acesse https://github.com/settings/tokens
2. Clique em "Generate new token"
3. Selecione os escopos necessários (pelo menos "repo")
4. Copie o token gerado e use-o como senha quando solicitado

## Verificação

Após enviar o código, acesse sua conta do GitHub no navegador para verificar se o repositório foi atualizado corretamente com todos os arquivos do projeto.

## Próximos Passos

Depois que seu código estiver no GitHub, você pode prosseguir com o deploy na Vercel seguindo as instruções no arquivo `DEPLOY-VERCEL.md`. 