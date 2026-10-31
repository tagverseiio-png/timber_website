#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Timber payment VM — one-shot bootstrap for a fresh Lightsail Ubuntu 24.04 box.
#
# Usage (as the default 'ubuntu' user):
#   sudo bash install.sh <https-host>          # e.g. sudo bash install.sh pay.example.com
#
# What it does:
#   1. Installs Node 22 LTS (NodeSource) and Caddy
#   2. Creates the 'timber' service user
#   3. Deploys the app to /opt/timber-payment (assumes repo already rsynced
#      or cloned there, INCLUDING server/.env — secrets never leave the VM)
#   4. Installs production deps + systemd unit, starts the service
#   5. Writes the Caddyfile with your host and starts auto-HTTPS
#
# Re-runnable: safe to run again after updating /opt/timber-payment.
# ---------------------------------------------------------------------------
set -euo pipefail

HOST="${1:-}"
if [[ -z "$HOST" ]]; then
  echo "usage: sudo bash install.sh <https-host>" >&2
  exit 1
fi

APP_DIR="/opt/timber-payment"
SERVICE_USER="timber"

echo "==> [1/6] Packages: Node 22 LTS + Caddy"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2- | cut -d. -f1)" != "22" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get update -qq
apt-get install -y caddy curl

echo "==> [2/6] Service user: $SERVICE_USER"
id -u "$SERVICE_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"

echo "==> [3/6] App dir: $APP_DIR"
[[ -f "$APP_DIR/package.json" ]] || { echo "FATAL: $APP_DIR/package.json missing — rsync the repo's server/ dir there first." >&2; exit 1; }
[[ -f "$APP_DIR/.env" ]] || { echo "FATAL: $APP_DIR/.env missing — copy server/.env (secrets) to the VM first." >&2; exit 1; }

echo "==> [4/6] npm ci --omit=dev"
cd "$APP_DIR"
npm ci --omit=dev

chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
chmod 640 "$APP_DIR/.env"          # readable by owner+group (timber), not world
chmod 700 "$APP_DIR"               # app dir itself private
# Re-apply after npm ci may have created node_modules as root.
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/node_modules"

echo "==> [5/6] systemd unit"
install -m 644 "$APP_DIR/deploy/timber-payment.service" /etc/systemd/system/timber-payment.service
systemctl daemon-reload
systemctl enable --now timber-payment.service

echo "==> [6/6] Caddy (auto-HTTPS for $HOST)"
mkdir -p /var/log/caddy
install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
sed -i "s|pay.example.com|$HOST|" /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy || systemctl restart caddy

echo
echo "==> Done. Verify:"
echo "    systemctl status timber-payment caddy"
echo "    journalctl -u timber-payment -f"
echo "    curl -s https://$HOST/health"
