# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package.json
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Crear directorio para configuración y service accounts
RUN mkdir -p /app/config /app/keys

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV DRIVES_CONFIG_PATH=/app/config/drives-config.json

# Exponer puerto si es necesario (MCP usa stdio por defecto)
# EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/index.js"]
