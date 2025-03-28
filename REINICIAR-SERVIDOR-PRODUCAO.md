# Instruções para Reiniciar o Servidor em Produção

Este documento fornece instruções passo a passo para reiniciar o servidor BemEstar em ambiente de produção de forma manual.

## Método 1: Usando comandos diretos do PowerShell

### 1. Encerrar processos existentes do Node.js

```powershell
# Encerrar todos os processos Node.js em execução
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. Definir o ambiente para produção e iniciar o servidor

```powershell
# Definir a variável de ambiente e iniciar o servidor
$env:NODE_ENV = "production"
npm run start
```

## Método 2: Usando o script simplificado

### 1. Verificar se o script existe

Certifique-se de que o arquivo `iniciar-servidor.ps1` existe no diretório raiz do projeto. Caso não exista, crie-o com o seguinte conteúdo:

```powershell
# Script simples para iniciar o servidor em modo de produção
$env:NODE_ENV = "production"
npm run start
```

### 2. Executar o script

```powershell
# Executar o script para iniciar o servidor
./iniciar-servidor.ps1
```

## Método 3: Reinicialização completa (caso ocorram problemas)

Se estiver enfrentando problemas com a inicialização, siga estes passos para uma reinicialização completa:

### 1. Encerrar todos os processos Node.js

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. Limpar cache e arquivos temporários

```powershell
# Remover pasta .next
if (Test-Path -Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
}

# Limpar cache do NPM
npm cache clean --force
```

### 3. Recompilar o projeto

```powershell
$env:NODE_ENV = "production"
npm run build
```

### 4. Iniciar o servidor

```powershell
$env:NODE_ENV = "production"
npm run start
```

## Verificação do Status do Servidor

Para verificar se o servidor está em execução:

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU
```

Se o comando acima mostrar processos Node.js em execução, o servidor está ativo.

## Acesso à Aplicação

Após reiniciar o servidor, a aplicação estará disponível em:

- URL padrão: http://localhost:3000
- URL personalizada: conforme definido na variável de ambiente `NEXT_PUBLIC_APP_URL`

## Resolução de Problemas Comuns

### Porta em uso

Se receber um erro indicando que a porta já está em uso:

```powershell
# Encontrar processo usando a porta 3000
netstat -ano | findstr :3000

# Encerrar o processo usando seu ID (substitua PID pelo ID do processo)
taskkill /PID PID /F
```

### Erro ao compilar

Se ocorrerem erros durante a compilação, verifique:

1. Execute o script para corrigir as versões do Next.js e React:
   ```powershell
   ./corrigir-versao-next-melhorado.ps1
   ```

2. Verifique se os componentes de Toast estão corretos:
   ```powershell
   ./corrigir-toast.ps1
   ```

3. Verifique as variáveis de ambiente:
   ```powershell
   ./verificar-producao.ps1
   ```

---

**Nota:** Se os scripts acima não funcionarem devido a problemas com o PowerShell, execute os comandos manualmente conforme descrito neste documento. 