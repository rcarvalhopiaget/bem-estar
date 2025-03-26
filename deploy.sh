#!/bin/bash

# Build da aplicação
npm run build

# Deploy para Vercel
vercel --prod

# Limpeza de cache
vercel cache clear

# Verificar status do deploy
vercel --prod --status
