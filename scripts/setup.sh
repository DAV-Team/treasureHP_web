#!/usr/bin/env bash
# Sets Culture Quest up with Docker on a new machine, in one command:  bash scripts/setup.sh
#   - creates .env.production with random secrets (only when it does not exist yet)
#   - loads bundled images when the package has them, otherwise builds from source
#   - starts mongo + server + client, waits until the site answers
#   - seeds the sample content, but only into an empty database
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

ENV_FILE=.env.production
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml)

say() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nLỗi: %s\n' "$*" >&2; exit 1; }
random_hex() { openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

command -v docker >/dev/null 2>&1 || fail "Chưa cài Docker. Cài Docker Desktop: https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || fail "Cần Docker Compose v2 (lệnh 'docker compose')."
docker info >/dev/null 2>&1 || fail "Docker chưa chạy. Hãy mở Docker Desktop rồi chạy lại."

if [ -f "$ENV_FILE" ]; then
  say "Dùng cấu hình có sẵn: $ENV_FILE"
else
  say "Tạo $ENV_FILE với khóa bí mật ngẫu nhiên"
  cat > "$ENV_FILE" <<ENV
JWT_SECRET=$(random_hex 32)
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@culturequest.local}
ADMIN_PASSWORD=$(random_hex 8)
WEB_PORT=${WEB_PORT:-8080}
# Khóa Google Maps được nhúng lúc build. Để trống thì bản đồ dùng OpenStreetMap.
VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY:-}
VITE_GOOGLE_MAPS_MAP_ID=${VITE_GOOGLE_MAPS_MAP_ID:-}
ENV
  chmod 600 "$ENV_FILE"
fi
env_value() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }
WEB_PORT_VALUE=$(env_value WEB_PORT); WEB_PORT_VALUE=${WEB_PORT_VALUE:-8080}

BUILD_ARG="--build"
if [ -f images/culture-quest-images.tar ]; then
  bundle_arch=$(cat images/PLATFORM 2>/dev/null || echo unknown)
  host_arch=$(docker version --format '{{.Server.Arch}}')
  if [ "$bundle_arch" = "$host_arch" ]; then
    say "Nạp image có sẵn trong gói ($bundle_arch), không cần build"
    docker load -i images/culture-quest-images.tar
    BUILD_ARG=""
  else
    say "Image trong gói dành cho $bundle_arch nhưng máy này là $host_arch: bỏ qua, build từ mã nguồn (cần Internet)"
  fi
fi

say "Khởi động hệ thống${BUILD_ARG:+ (build lần đầu mất vài phút)}"
"${COMPOSE[@]}" up -d $BUILD_ARG

say "Chờ website sẵn sàng"
ready=0
for _ in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T client wget -qO- http://127.0.0.1/api/health >/dev/null 2>&1; then ready=1; break; fi
  sleep 3
done
if [ "$ready" != 1 ]; then
  "${COMPOSE[@]}" logs --tail 40 server >&2 || true
  fail "Hệ thống chưa sẵn sàng sau 2 phút. Xem log ở trên, hoặc chạy: ${COMPOSE[*]} logs"
fi

location_count=$("${COMPOSE[@]}" exec -T mongo mongosh --quiet culture-quest --eval 'db.locations.countDocuments()' | tr -d '[:space:]')
if [ "$location_count" = "0" ]; then
  say "Nạp dữ liệu mẫu (database đang trống)"
  "${COMPOSE[@]}" run --rm --no-deps server node dist/database/seed-cli.js
else
  say "Database đã có $location_count địa điểm, giữ nguyên (không nạp dữ liệu mẫu)"
fi

cat <<DONE

Xong! Culture Quest đang chạy.
  Website : http://localhost:${WEB_PORT_VALUE}
  Admin   : http://localhost:${WEB_PORT_VALUE}/admin
  Tài khoản admin : $(env_value ADMIN_EMAIL)
  Mật khẩu admin  : xem ADMIN_PASSWORD trong file $ENV_FILE

Xem log : ${COMPOSE[*]} logs -f
Dừng    : ${COMPOSE[*]} down
DONE
