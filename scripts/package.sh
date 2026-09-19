#!/usr/bin/env bash
# Packs the project into an archive that runs on another machine.
#   bash scripts/package.sh                 source package (the other machine builds; needs Internet the first time)
#   bash scripts/package.sh --with-images   also bundles ready-built Docker images (no build on the other machine,
#                                           but only for the same CPU architecture as this one)
# Output goes to release/. Secrets (.env files), node_modules and build output are never included.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

WITH_IMAGES=0
case "${1:-}" in
  "") ;;
  --with-images) WITH_IMAGES=1 ;;
  *) echo "Cách dùng: bash scripts/package.sh [--with-images]" >&2; exit 1 ;;
esac

STAMP=$(date +%Y%m%d)
NAME="culture-quest-$STAMP"
OUT="$(pwd)/release"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$OUT" "$STAGE/$NAME"

echo "==> Sao chép mã nguồn (bỏ node_modules, dist, .env, ...)"
COPYFILE_DISABLE=1 tar -cf - \
  --exclude=node_modules --exclude=dist --exclude=coverage --exclude=test-results --exclude=playwright-report \
  --exclude=release --exclude=.git --exclude=.DS_Store --exclude='*.tsbuildinfo' --exclude=npm-debug.log \
  --exclude=.env --exclude=.env.production --exclude=.env.local \
  . | tar -xf - -C "$STAGE/$NAME"

if [ "$WITH_IMAGES" = 1 ]; then
  command -v docker >/dev/null 2>&1 || { echo "Cần Docker để đóng gói image." >&2; exit 1; }
  ARCH=$(docker version --format '{{.Server.Arch}}')
  NAME="$NAME-offline-$ARCH"
  mv "$STAGE/culture-quest-$STAMP" "$STAGE/$NAME"
  echo "==> Build image ($ARCH). Khóa bản đồ lấy từ biến môi trường VITE_GOOGLE_MAPS_API_KEY nếu có"
  # The compose file insists on these two variables even for `build`; the values are not baked into the images.
  JWT_SECRET=build-only ADMIN_PASSWORD=build-only docker compose -f docker-compose.prod.yml build server client
  docker image inspect mongo:7 >/dev/null 2>&1 || docker pull mongo:7
  mkdir -p "$STAGE/$NAME/images"
  echo "==> Xuất image ra file (mất vài phút)"
  docker save culture-quest-server:latest culture-quest-client:latest mongo:7 -o "$STAGE/$NAME/images/culture-quest-images.tar"
  echo "$ARCH" > "$STAGE/$NAME/images/PLATFORM"
fi

echo "==> Nén"
tar -czf "$OUT/$NAME.tar.gz" -C "$STAGE" "$NAME"
if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE" && zip -qr "$OUT/$NAME.zip" "$NAME")
fi

echo
echo "Đã tạo trong release/:"
ls -lh "$OUT"/"$NAME".* | awk '{print "  " $9 "  (" $5 ")"}'
echo
echo "Trên máy khác: giải nén, cd vào thư mục, rồi chạy:  bash scripts/setup.sh"
