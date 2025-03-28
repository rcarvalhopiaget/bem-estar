# Script para corrigir problemas com o Toast component
Write-Host "Corrigindo problemas de case-sensitivity do Toast..." -ForegroundColor Cyan

# Verificar se existem arquivos toast.tsx e Toast.tsx
$toastLowerCase = Test-Path -Path "src/components/ui/toast.tsx"
$toastUpperCase = Test-Path -Path "src/components/ui/Toast.tsx"

if ($toastLowerCase -and $toastUpperCase) {
    Write-Host "Encontrados dois arquivos (toast.tsx e Toast.tsx)." -ForegroundColor Yellow
    Write-Host "Removendo Toast.tsx para evitar conflitos..." -ForegroundColor Yellow
    Remove-Item -Path "src/components/ui/Toast.tsx" -Force
    Write-Host "Arquivo Toast.tsx removido com sucesso." -ForegroundColor Green
} elseif ($toastUpperCase -and -not $toastLowerCase) {
    Write-Host "Encontrado apenas Toast.tsx (maiúsculo)." -ForegroundColor Yellow
    Write-Host "Renomeando para toast.tsx..." -ForegroundColor Yellow
    Rename-Item -Path "src/components/ui/Toast.tsx" -NewName "toast.tsx"
    Write-Host "Arquivo renomeado com sucesso." -ForegroundColor Green
} elseif ($toastLowerCase) {
    Write-Host "Arquivo toast.tsx já existe com a nomenclatura correta." -ForegroundColor Green
} else {
    Write-Host "Nenhum arquivo toast.tsx encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se existem importações inconsistentes
Write-Host "Verificando importações inconsistentes..." -ForegroundColor Yellow

# Lista de arquivos a verificar
$arquivosParaVerificar = @(
    "src/components/ui/use-toast.ts",
    "src/components/ui/Toaster.tsx",
    "src/components/ui/toast-wrapper.tsx"
)

foreach ($arquivo in $arquivosParaVerificar) {
    if (Test-Path $arquivo) {
        $conteudo = Get-Content $arquivo -Raw
        if ($conteudo -match "@/components/ui/Toast") {
            Write-Host "Encontrada importação inconsistente em $arquivo" -ForegroundColor Yellow
            $conteudoCorrigido = $conteudo -replace "@/components/ui/Toast", "@/components/ui/toast"
            Set-Content -Path $arquivo -Value $conteudoCorrigido
            Write-Host "Corrigida importação em $arquivo" -ForegroundColor Green
        }
    } else {
        Write-Host "Arquivo $arquivo não encontrado!" -ForegroundColor Red
    }
}

Write-Host "Limpando pasta .next..." -ForegroundColor Yellow
if (Test-Path -Path ".next") {
    Remove-Item -Recurse -Force .next
}

Write-Host "Correções concluídas com sucesso!" -ForegroundColor Green
Write-Host "Agora você pode executar 'npm run build' para compilar a aplicação." -ForegroundColor Cyan 