#!/usr/bin/env bash
# Manual deploy script for Worku-admin. Run on the VPS:
#   cd /var/www/Worku-admin && ./scripts/deploy.sh
set -euo pipefail

APP_DIR="/var/www/Worku-admin"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$APP_DIR"

echo "==> Fetching latest from origin/main"
git fetch --prune origin
git reset --hard origin/main

echo "==> Ensuring worku-network exists"
docker network inspect worku-network >/dev/null 2>&1 \
  || docker network create worku-network

echo "==> Building and starting worku-admin"
docker compose -f "$COMPOSE_FILE" up -d --build

echo "==> Pruning dangling images"
docker image prune -f

echo "==> Reloading Worku nginx to pick up admin upstream"
if docker ps --format '{{.Names}}' | grep -q '^worku-nginx$'; then
  docker exec worku-nginx nginx -t
  docker exec worku-nginx nginx -s reload
else
  echo "WARNING: worku-nginx is not running. Start it from /var/www/Worku."
fi

echo "==> Deploy complete"
docker compose -f "$COMPOSE_FILE" ps
