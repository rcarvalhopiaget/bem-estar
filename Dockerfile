FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copiar arquivos do projeto
COPY package.json package-lock.json ./
COPY next.config.js ./
COPY public ./public
COPY src ./src

# Instalar dependências
RUN npm ci --omit=dev

# Necessário para processamento de imagens
RUN npm install sharp --no-save

# Executar build
RUN npm run build

# Configurar usuário para execução
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

EXPOSE 3000

CMD ["npm", "start"] 