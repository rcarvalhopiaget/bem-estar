# Guia Rápido para Implantação em Produção

Este guia fornece instruções passo a passo para implantar o sistema BemEstar em ambiente de produção, incluindo soluções para problemas comuns.

## Pré-requisitos

- Node.js (versão recomendada: 18.x LTS)
- NPM (versão 8+)
- PowerShell em ambiente Windows
- Projeto BemEstar clonado e configurado

## 1. Preparação do Ambiente

### 1.1. Corrigir versões de dependências
```powershell
# Corrige as versões do Next.js e React para garantir compatibilidade
./corrigir-versao-next-melhorado.ps1
```

### 1.2. Verificar/criar componentes essenciais
```powershell
# Corrige problemas com o componente Toast (caso necessário)
./corrigir-toast.ps1
```

> 💡 **Dica**: Se encontrar erros relacionados ao componente Toast, consulte o documento `RESOLVER-PROBLEMA-TOAST.md` para instruções mais detalhadas.

## 2. Configuração do Ambiente

### 2.1. Verificar variáveis de ambiente
```powershell
# Verifica se todas as variáveis de ambiente necessárias estão configuradas
./verificar-producao.ps1
```

### 2.2. Configuração manual (se necessário)
- Verifique se o arquivo `.env.production` existe e contém as configurações corretas:
  - Configurações do Firebase
  - URL da aplicação
  - Configurações de email (SendGrid)
  - Segredos de sessão e JWT

## 3. Compilação e Implantação

### 3.1. Compilar o projeto
```powershell
# Define o ambiente como produção e compila o projeto
$env:NODE_ENV="production"; npm run build
```

### 3.2. Iniciar o servidor de produção
```powershell
# Script que verifica pré-requisitos e inicia o servidor em produção
./iniciar-producao-simplificado.ps1
```

Alternativamente, inicie o servidor manualmente:
```powershell
$env:NODE_ENV="production"; npm run start
```

## 4. Verificações Pós-Implantação

Depois de iniciar o servidor, verifique:

- Acesso à aplicação na URL configurada (padrão: http://localhost:3000)
- Login de usuários (teste com credenciais válidas)
- Acesso a dados e funcionalidades principais
- Funcionamento das notificações
- Fluxos de trabalho críticos (ex.: cadastro de alunos, registro de refeições)

## 5. Resolução de Problemas Comuns

### 5.1. Erro de compilação relacionado ao Next.js
**Problema**: Erros durante `npm run build` relacionados a versões incompatíveis.
**Solução**: 
```powershell
./corrigir-versao-next-melhorado.ps1
```

### 5.2. Componente Toast não encontrado
**Problema**: Erros sobre arquivos ou componentes de Toast não encontrados.
**Solução**: Consulte `RESOLVER-PROBLEMA-TOAST.md` e execute:
```powershell
./corrigir-toast.ps1
```

### 5.3. Variáveis de ambiente não encontradas
**Problema**: Erros mencionando variáveis de ambiente indefinidas.
**Solução**:
1. Verifique se `.env.production` existe e está configurado
2. Execute `./verificar-producao.ps1` para identificar variáveis faltantes
3. Adicione as variáveis faltantes ao arquivo `.env.production`

### 5.4. Case sensitivity em importações
**Problema**: Erros de importação que funcionam em desenvolvimento mas falham em produção.
**Solução**: Verifique a capitalização exata nos nomes de arquivos e caminhos de importação. 

## 6. Comandos Úteis

### 6.1. Iniciar servidor em modo de produção
```powershell
$env:NODE_ENV="production"; npm run start
```

### 6.2. Verificar diretório .next
```powershell
Test-Path -Path ".next"  # Deve retornar True se o build foi realizado
```

### 6.3. Verificar status do servidor
```powershell
Get-Process -Name "node"  # Verificar se o servidor Node.js está em execução
```

### 6.4. Limpar cache e reconstruir
```powershell
npm cache clean --force
Remove-Item -Path ".next" -Recurse -Force
npm run build
```

## 7. Notas Adicionais

- O sistema foi otimizado para utilizar React 18.2.0 e Next.js 13.5.6
- Recomenda-se não atualizar estas versões sem testes extensivos
- Sempre verifique as dependências após atualizações para garantir compatibilidade
- Mantenha backups regulares do banco de dados e configurações

## 8. Suporte

Para problemas não cobertos neste guia, consulte:
- Documentação do projeto em `/docs`
- Documento `SOLUCOES-PRODUCAO.md` com soluções detalhadas
- Logs de erro em `/logs` (se disponíveis)

---

**Referência Rápida de Scripts**

| Script | Propósito |
|--------|-----------|
| `corrigir-versao-next-melhorado.ps1` | Corrige versões do Next.js e React |
| `corrigir-toast.ps1` | Resolve problemas com o componente Toast |
| `verificar-producao.ps1` | Verifica variáveis de ambiente |
| `iniciar-producao-simplificado.ps1` | Inicia o servidor em produção | 