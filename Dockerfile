FROM node:18-alpine AS base

# Estágio de desenvolvimento - onde instalamos todas as dependências
FROM base AS deps
WORKDIR /app

# Instalar dependências para compilação
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar arquivos de package
COPY package.json package-lock.json ./

# Instalar todas as dependências (incluindo as de desenvolvimento)
RUN npm install

# Estágio de build - onde compilamos a aplicação
FROM base AS builder
WORKDIR /app

# Variáveis de ambiente para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_DISABLE_TYPECHECK=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copiar as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Debug: listar arquivos para verificar se tudo foi copiado corretamente
RUN ls -la
RUN ls -la src
RUN ls -la src/components 2>/dev/null || echo "Diretório src/components não encontrado"
RUN ls -la src/components/ui 2>/dev/null || echo "Diretório src/components/ui não encontrado"
RUN cat next.config.js

# Verificar se os arquivos essenciais existem
RUN if [ ! -f "next.config.js" ]; then echo "ERRO: next.config.js não encontrado"; exit 1; fi
RUN if [ ! -d "src" ]; then echo "ERRO: diretório src não encontrado"; exit 1; fi

# Executar build com saída detalhada
RUN npm run build --verbose

# Estágio de produção - apenas o necessário para rodar a aplicação
FROM base AS runner
WORKDIR /app

# Variáveis de ambiente para produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Criar usuário não-root para produção
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos build, node_modules e diretório public
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Configurar permissões
RUN chown -R nextjs:nodejs /app

# Usar usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Iniciar a aplicação
CMD ["node", "server.js"] 