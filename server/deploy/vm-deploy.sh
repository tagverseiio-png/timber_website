#!/usr/bin/env bash
# Timber payment VM — pull-to-deploy script, called by GitHub Actions.
# git reset --hard origin/main → npm ci (only when the lockfile changed)
# → pm2 startOrReload. Idempotent: safe on first boot and on every push.
set -euo pipefail

APP_DIR="/opt/timber_website"
APP="${APP_DIR}/server"
LOG=/var/log/timber-payment/deploy.log
mkdir -p /var/log/timber-payment
exec >> "$LOG" 2>&1
echo "=== deploy $(date -Is) by $(whoami) ==="

cd "$APP_DIR"
git fetch origin
BEFORE=$(git rev-parse HEAD)
git reset --hard origin/main
AFTER=$(git rev-parse HEAD)
echo "git: ${BEFORE:0:7} → ${AFTER:0:7}"

# Install dependencies first, so a reload never runs on a half-updated node_modules.
if git diff --name-only "$BEFORE" "$AFTER" -- server/package-lock.json | grep -q . || [ ! -d "$APP/node_modules" ]; then
  echo "npm ci $(git diff --name-only "$BEFORE" "$AFTER" -- server/package-lock.json | grep -q . && echo '(lockfile changed)' || echo '(node_modules came with the VM)')"
  npm_ci=1
  ( cd "$APP" && npm ci --omit=dev --no-audit --no-fund )
fi

# Reload the app. startOrReload starts it when missing, reloads when running.
cd "$APP"
pm2 startOrReload "$APP/ecosystem.config.cjs" --update-env
pm2 save

sleep 2
pm2 status timber-payment
curl -fsS http://127.0.0.1:8080/healthz && echo " (healthz ok)"
echo "=== deployed $(date -Is) OK ==="
