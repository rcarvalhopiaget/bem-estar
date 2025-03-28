Write-Host "Configurando e atualizando o Git para o projeto BemEstar..." -ForegroundColor Cyan

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✓ Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git não encontrado. Por favor, instale o Git antes de continuar." -ForegroundColor Red
    Write-Host "   Download: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit
}

# Configurar Git (se necessário)
Write-Host "`nConfigurando Git..." -ForegroundColor Cyan

$userName = Read-Host "Digite seu nome de usuário do Git (ou pressione Enter para pular)"
if ($userName) {
    git config --global user.name "$userName"
    Write-Host "✓ Nome de usuário configurado: $userName" -ForegroundColor Green
} else {
    $currentName = git config --global user.name
    if ($currentName) {
        Write-Host "✓ Nome de usuário já configurado: $currentName" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Nome de usuário não configurado" -ForegroundColor Yellow
    }
}

$userEmail = Read-Host "Digite seu email do Git (ou pressione Enter para pular)"
if ($userEmail) {
    git config --global user.email "$userEmail"
    Write-Host "✓ Email configurado: $userEmail" -ForegroundColor Green
} else {
    $currentEmail = git config --global user.email
    if ($currentEmail) {
        Write-Host "✓ Email já configurado: $currentEmail" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Email não configurado" -ForegroundColor Yellow
    }
}

# Inicializar Git (se necessário)
Write-Host "`nVerificando inicialização do Git..." -ForegroundColor Cyan
if (-not (Test-Path -Path ".git")) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Repositório Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✓ Repositório Git já inicializado" -ForegroundColor Green
}

# Configurar repositório remoto
Write-Host "`nConfigurando repositório remoto..." -ForegroundColor Cyan
$remoteUrl = Read-Host "Digite a URL do repositório GitHub (ex: https://github.com/seu-usuario/bem-estar.git) ou pressione Enter para pular"

if ($remoteUrl) {
    # Verificar se o remote origin já existe
    $remoteExists = git remote | Select-String -Pattern "^origin$"
    
    if ($remoteExists) {
        # Atualizar URL do remote existente
        git remote set-url origin $remoteUrl
        Write-Host "✓ URL do repositório remoto atualizada: $remoteUrl" -ForegroundColor Green
    } else {
        # Adicionar novo remote
        git remote add origin $remoteUrl
        Write-Host "✓ Repositório remoto adicionado: $remoteUrl" -ForegroundColor Green
    }
} else {
    $currentRemote = git remote get-url origin 2>$null
    if ($currentRemote) {
        Write-Host "✓ Repositório remoto já configurado: $currentRemote" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Repositório remoto não configurado" -ForegroundColor Yellow
    }
}

# Adicionar todos os arquivos
Write-Host "`nAdicionando arquivos ao staging..." -ForegroundColor Cyan
git add .
Write-Host "✓ Arquivos adicionados ao staging" -ForegroundColor Green

# Criar commit
Write-Host "`nCriando commit..." -ForegroundColor Cyan
$commitMessage = Read-Host "Digite a mensagem de commit (ou pressione Enter para usar mensagem padrão)"
if (-not $commitMessage) {
    $commitMessage = "Projeto BemEstar pronto para deploy na Vercel"
}
git commit -m "$commitMessage"
Write-Host "✓ Commit criado com a mensagem: '$commitMessage'" -ForegroundColor Green

# Empurrar para o repositório remoto
Write-Host "`nEnviando para o GitHub..." -ForegroundColor Cyan
$branchName = Read-Host "Digite o nome da branch (ou pressione Enter para usar 'main')"
if (-not $branchName) {
    $branchName = "main"
}

# Tentar push normal primeiro
Write-Host "Tentando push para o GitHub..." -ForegroundColor Yellow
$pushResult = git push -u origin $branchName 2>&1
if ($pushResult -match "error|fatal|rejected") {
    Write-Host "⚠️ Push encontrou problemas. Tentando soluções alternativas..." -ForegroundColor Yellow
    
    # Perguntar se o usuário quer fazer pull primeiro
    $doPull = Read-Host "Deseja tentar fazer pull antes? (s/n)"
    if ($doPull -eq "s") {
        Write-Host "Executando pull com rebase..." -ForegroundColor Yellow
        git pull --rebase origin $branchName
        Write-Host "Tentando push novamente..." -ForegroundColor Yellow
        git push -u origin $branchName
    } else {
        # Perguntar se o usuário quer forçar o push
        $doForce = Read-Host "Deseja forçar o push? CUIDADO: Isso sobrescreverá o histórico remoto! (s/n)"
        if ($doForce -eq "s") {
            Write-Host "Executando push forçado..." -ForegroundColor Yellow
            git push -f origin $branchName
        } else {
            Write-Host "Push cancelado pelo usuário." -ForegroundColor Red
        }
    }
} else {
    Write-Host "✓ Push bem-sucedido para a branch $branchName" -ForegroundColor Green
}

Write-Host "`n===== Próximos passos =====" -ForegroundColor Cyan
Write-Host "Agora que seu código está no GitHub, você pode fazer o deploy na Vercel:"
Write-Host "1. Acesse https://vercel.com/"
Write-Host "2. Importe seu repositório GitHub"
Write-Host "3. Configure conforme o documento DEPLOY-VERCEL.md"
Write-Host "4. Clique em 'Deploy'"
Write-Host "`nSe precisar de ajuda, consulte os documentos:"
Write-Host "- DEPLOY-VERCEL.md - Instruções detalhadas para deploy"
Write-Host "- COMANDOS-UTEIS.md - Lista de comandos úteis do Git e Vercel" 