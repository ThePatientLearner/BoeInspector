# Contexto de build: la raíz del monorepo (ver docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/monolith/package.json apps/monolith/
RUN npm ci --workspace @boe-inspector/monolith --include-workspace-root=false || npm install --workspace @boe-inspector/monolith
COPY tsconfig.base.json ./
COPY apps/monolith apps/monolith
RUN npm run build --workspace @boe-inspector/monolith

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Sin dependencias externas de IA: el resumidor habla HTTP con la API
# configurada en AI_BASE_URL. Imagen más pequeña y arranque inmediato.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/monolith/dist ./dist
COPY --from=build /repo/apps/monolith/package.json ./
EXPOSE 3001
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/main.js"]
