@echo off
echo ====================================
echo  Enviando Projeto BemEstar para GitHub
echo ====================================
echo.

REM Verifica se o Git está instalado
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Git nao foi encontrado. Instale o Git antes de continuar.
    echo Download: https://git-scm.com/downloads
    pause
    exit /b
)

echo Git encontrado. Prosseguindo...
echo.

REM Verificar se o diretório .git existe
if not exist .git (
    echo Inicializando repositorio Git...
    git init
    echo Repositorio Git inicializado.
    echo.
)

REM Perguntar por informações do usuário
set /p USERNAME="Digite seu nome de usuario do Git (ou pressione Enter para pular): "
if not "%USERNAME%"=="" (
    git config --global user.name "%USERNAME%"
    echo Nome de usuario configurado: %USERNAME%
    echo.
)

set /p EMAIL="Digite seu email do Git (ou pressione Enter para pular): "
if not "%EMAIL%"=="" (
    git config --global user.email "%EMAIL%"
    echo Email configurado: %EMAIL%
    echo.
)

REM Perguntar pelo repositório
set /p REPO_URL="Digite a URL do repositorio GitHub (ex: https://github.com/seu-usuario/seu-repositorio.git): "
if "%REPO_URL%"=="" (
    echo ERRO: URL do repositorio e necessaria para continuar.
    pause
    exit /b
)

REM Verificar se o remote origin já existe
git remote | findstr "^origin$" >nul
if %ERRORLEVEL% EQU 0 (
    git remote set-url origin %REPO_URL%
    echo URL do repositorio remoto atualizada: %REPO_URL%
) else (
    git remote add origin %REPO_URL%
    echo Repositorio remoto adicionado: %REPO_URL%
)
echo.

REM Adicionar arquivos
echo Adicionando arquivos ao staging...
git add .
echo Arquivos adicionados.
echo.

REM Criar commit
set /p COMMIT_MSG="Digite a mensagem de commit (ou pressione Enter para usar mensagem padrao): "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Projeto BemEstar pronto para deploy na Vercel
)

echo Criando commit com mensagem: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"
echo.

REM Branch
set /p BRANCH="Digite o nome da branch (ou pressione Enter para usar 'main'): "
if "%BRANCH%"=="" (
    set BRANCH=main
)

REM Push para o GitHub
echo Enviando para a branch %BRANCH% no GitHub...
git push -u origin %BRANCH%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ATENCAO: Ocorreu um problema ao enviar para o GitHub.
    echo.
    
    set /p DO_PULL="Deseja tentar fazer pull antes? (s/n): "
    if /i "%DO_PULL%"=="s" (
        echo Executando pull com rebase...
        git pull --rebase origin %BRANCH%
        echo Tentando push novamente...
        git push -u origin %BRANCH%
    ) else (
        set /p DO_FORCE="Deseja forcar o push? CUIDADO: Isso sobrescrevera o historico remoto! (s/n): "
        if /i "%DO_FORCE%"=="s" (
            echo Executando push forcado...
            git push -f origin %BRANCH%
        ) else (
            echo Push cancelado pelo usuario.
        )
    )
) else (
    echo Codigo enviado com sucesso para o GitHub!
)

echo.
echo =======================================
echo  Proximo Passo: Deploy na Vercel
echo =======================================
echo.
echo Agora que seu codigo esta no GitHub, voce pode fazer o deploy na Vercel:
echo 1. Acesse https://vercel.com/
echo 2. Importe seu repositorio GitHub
echo 3. Configure conforme o documento DEPLOY-VERCEL.md
echo 4. Clique em 'Deploy'
echo.
echo Para mais detalhes, consulte o arquivo DEPLOY-VERCEL.md
echo.

pause 