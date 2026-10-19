#!/bin/bash
# Aplica as migrações e sobe API + nginx. Se um dos dois cair, o container cai
# junto para o orquestrador reiniciar.
set -euo pipefail

mkdir -p "${MEDIA_DIR:-/data/media}"
cd /app/apps/backend

echo "[entrypoint] aplicando migrações do banco"
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] subindo API (porta ${PORT:-7192}) e nginx (7693 app, 5928 painel, 6400 landing)"
node dist/main.js &
API_PID=$!
nginx -g 'daemon off;' &
NGINX_PID=$!

trap 'kill -TERM "$API_PID" "$NGINX_PID" 2>/dev/null || true' TERM INT
wait -n "$API_PID" "$NGINX_PID"
STATUS=$?
kill -TERM "$API_PID" "$NGINX_PID" 2>/dev/null || true
exit "$STATUS"
