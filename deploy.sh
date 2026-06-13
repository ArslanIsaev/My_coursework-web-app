#!/bin/bash
# deploy.sh — собирает образы на macOS M3 (linux/amd64) и разворачивает на Ubuntu-сервере
# Использование: ./deploy.sh <server_ip> [ssh_user]

set -e

SERVER_IP="${1:?Укажи IP сервера: ./deploy.sh 1.2.3.4}"
SSH_USER="${2:-root}"
REMOTE="$SSH_USER@$SERVER_IP"
PROJECT="sportshop"
REMOTE_DIR="/opt/$PROJECT"

echo "🏗  Сборка образов для linux/amd64 (Apple Silicon cross-compile)..."
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t ${PROJECT}_backend:latest \
  ./backend

# Если NEXT_PUBLIC_API_URL не задан, используем IP сервера
API_URL="${NEXT_PUBLIC_API_URL:-http://$SERVER_IP/api}"

docker buildx build \
  --platform linux/amd64 \
  --load \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  -t ${PROJECT}_frontend:latest \
  ./frontend

echo "📦 Сохраняем образы в tar-архивы..."
docker save ${PROJECT}_backend:latest | gzip > /tmp/${PROJECT}_backend.tar.gz
docker save ${PROJECT}_frontend:latest | gzip > /tmp/${PROJECT}_frontend.tar.gz

echo "📡 Копируем образы на сервер ($REMOTE)..."
scp /tmp/${PROJECT}_backend.tar.gz /tmp/${PROJECT}_frontend.tar.gz "$REMOTE:/tmp/"

echo "📋 Копируем конфиги на сервер..."
ssh "$REMOTE" "mkdir -p $REMOTE_DIR"
scp docker-compose.yml nginx.conf "$REMOTE:$REMOTE_DIR/"
scp .env.example "$REMOTE:$REMOTE_DIR/.env.example"
# Копируем .env только если он существует локально
[ -f .env ] && scp .env "$REMOTE:$REMOTE_DIR/.env"

echo "🚀 Запускаем деплой на сервере..."
ssh "$REMOTE" bash << EOF
  set -e
  cd $REMOTE_DIR

  echo "  Загружаем образы..."
  docker load < /tmp/${PROJECT}_backend.tar.gz
  docker load < /tmp/${PROJECT}_frontend.tar.gz
  rm -f /tmp/${PROJECT}_backend.tar.gz /tmp/${PROJECT}_frontend.tar.gz

  # Устанавливаем docker-compose если нет
  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
    apt-get install -y docker-compose-plugin
  fi

  # Создаём .env из примера если нет
  [ -f .env ] || cp .env.example .env

  echo "  Перезапускаем контейнеры..."
  docker compose down --remove-orphans || docker-compose down --remove-orphans
  docker compose up -d || docker-compose up -d

  echo "  Статус контейнеров:"
  docker compose ps || docker-compose ps
EOF

echo ""
echo "✅ Деплой завершён!"
echo "   Сайт доступен: http://$SERVER_IP"
echo "   Логи бекэнда: ssh $REMOTE 'docker compose -C $REMOTE_DIR logs -f backend'"
