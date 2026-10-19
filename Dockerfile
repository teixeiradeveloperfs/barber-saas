# syntax=docker/dockerfile:1.7
# Uma imagem só, no molde dos outros projetos no Dokploy: API (Node) + nginx
# servindo app do cliente, painel e landing, cada um numa porta.
#   7192 API · 7693 app do cliente · 5928 painel · 6400 landing

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---------- build ----------
FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/tenant-config/package.json packages/tenant-config/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/admin/package.json apps/admin/
COPY apps/landing/package.json apps/landing/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

# URLs públicas entram no build dos fronts (Vite). O app do cliente não tem host:
# resolve a barbearia pelo próprio domínio. Sobrescreva por build args se mudar.
ARG VITE_API_URL=https://api.barberosbr.com
ARG VITE_ADMIN_URL=https://admin.barberosbr.com
ARG VITE_LANDING_URL=https://barberosbr.com
ARG VITE_APP_NAME=BarberOS
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ADMIN_URL=$VITE_ADMIN_URL \
    VITE_LANDING_URL=$VITE_LANDING_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_FRONTEND_URL= \
    VITE_DEMO_URL= \
    VITE_CONTACT_WHATSAPP=

RUN pnpm --filter @barber/tenant-config build
# prisma generate só precisa de uma URL com formato válido; nada conecta aqui.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter @barber/backend build
RUN pnpm --filter @barber/frontend build \
 && pnpm --filter @barber/admin build \
 && pnpm --filter @barber/landing build

# ---------- runtime ----------
FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends nginx openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/* /etc/nginx/sites-enabled/default
# APP_STATIC_URL: a API lê arquivos estáticos do próprio app pelo nginx local.
ENV NODE_ENV=production PORT=7192 MEDIA_DIR=/data/media APP_STATIC_URL=http://127.0.0.1:7693
WORKDIR /app

# node_modules do pnpm é feito de links para /app/node_modules/.pnpm: os caminhos precisam ser os mesmos.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/tenant-config/package.json packages/tenant-config/
COPY --from=build /app/packages/tenant-config/dist packages/tenant-config/dist
COPY --from=build /app/packages/tenant-config/node_modules packages/tenant-config/node_modules
COPY --from=build /app/apps/backend/package.json /app/apps/backend/prisma.config.ts apps/backend/
COPY --from=build /app/apps/backend/node_modules apps/backend/node_modules
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma

COPY --from=build /app/apps/frontend/dist /srv/app
COPY --from=build /app/apps/admin/dist /srv/admin
COPY --from=build /app/apps/landing/dist /srv/landing
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data/media

VOLUME /data
EXPOSE 7192 7693 5928 6400
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
