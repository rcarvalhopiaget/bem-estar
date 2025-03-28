# Script simplificado para instalar dependências MUI
Write-Host "Instalando dependências do Material UI..."

# Instalar dependências
npm install @mui/system @mui/material @emotion/react @emotion/styled --save

# Forçar versões específicas
npm install react@18.2.0 react-dom@18.2.0 --save

Write-Host "Dependências instaladas. Pronto para construir." 