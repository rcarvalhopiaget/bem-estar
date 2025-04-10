FROM node:18-alpine AS base

# Instalar dependências necessárias para compilação
RUN apk add --no-cache libc6-compat python3 make g++

# Step 1: Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json .env.docker ./

# Install dependencies (ci for clean install)
RUN npm ci

# Step 2: Build the app
FROM base AS builder
WORKDIR /app

# Copiar variáveis de ambiente para o builder
COPY --from=deps /app/.env.docker ./.env.production
# Carregar as variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_DISABLE_TYPECHECK=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy node_modules and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Verificar se arquivos importantes existem
RUN if [ ! -f next.config.js ]; then echo "next.config.js não encontrado"; exit 1; fi
RUN if [ ! -f package.json ]; then echo "package.json não encontrado"; exit 1; fi

# Verificar se diretórios importantes existem
RUN if [ ! -d src ]; then echo "diretório src não encontrado"; exit 1; fi
RUN if [ ! -d public ]; then mkdir -p public; fi

# Instalar sharp para otimizar imagens
RUN npm install sharp --no-save

# Build da aplicação
RUN npm run build

# Step 3: Production image
FROM base AS runner
WORKDIR /app

# Definir variáveis de ambiente para produção
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
ENTRYPOINT ["node", "server.js"] 