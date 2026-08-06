# Contexto de build: la raíz del monorepo (ver docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @boe-inspector/web --include-workspace-root=false || npm install --workspace @boe-inspector/web
COPY apps/web apps/web
RUN npm run build --workspace @boe-inspector/web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
