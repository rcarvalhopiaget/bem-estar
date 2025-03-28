# Script simplificado para enviar o código para o GitHub
# Execute este script no PowerShell
# Edite as variáveis no início do script conforme necessário

# Configurações - Edite estas variáveis
$REPOSITORIO_URL = "https://github.com/seu-usuario/seu-repositorio.git"  # Substitua pelo seu repositório
$NOME_BRANCH = "main"  # Nome da branch
$MENSAGEM_COMMIT = "Projeto BemEstar pronto para deploy"  # Mensagem do commit

# Inicializar Git (se necessário)
if (-not (Test-Path -Path ".git")) {
    Write-Host "Inicializando repositório Git..."
    git init
}

# Configurar repositório remoto
$remoteExists = git remote | Select-String -Pattern "^origin$"
if ($remoteExists) {
    # Atualizar URL do remote existente
    git remote set-url origin $REPOSITORIO_URL
} else {
    # Adicionar novo remote
    git remote add origin $REPOSITORIO_URL
}

# Adicionar arquivos e criar commit
git add .
git commit -m $MENSAGEM_COMMIT

# Tentar push
git push -u origin $NOME_BRANCH

# Se o push falhar, tente estas linhas alternativas (descomente conforme necessário)
# git pull --rebase origin $NOME_BRANCH
# git push -u origin $NOME_BRANCH

# Se ainda falhar e você quiser forçar o push (use com cautela)
# git push -f origin $NOME_BRANCH

Write-Host "Processo concluído. Verifique as mensagens acima para confirmar se houve sucesso."
Write-Host "Agora você pode fazer o deploy do projeto na Vercel seguindo as instruções em DEPLOY-VERCEL.md" 