#!/bin/sh
# Runs ON the VPS, called by .github/workflows/ci-cd.yml over a single SSH session.
# Pulls only the images that changed, lets compose recreate only those containers, rolls back if the
# app does not come back healthy, then removes this app's previous images. Nothing is built here.
# Refuses to run at all if either image ends up unresolved, instead of letting a half-deployed .env.production
# take down a healthy service.
#
# Env: SERVER_IMAGE / CLIENT_IMAGE (empty = keep the running one), GHCR_USER, GHCR_TOKEN.
set -eu

ENV_FILE=.env.production
dc="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"

env_value() { grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true; }
set_env() { sed -i "/^$1=/d" "$ENV_FILE"; [ -z "$2" ] || echo "$1=$2" >> "$ENV_FILE"; }

previous_server=$(env_value SERVER_IMAGE)
previous_client=$(env_value CLIENT_IMAGE)
pull=""
if [ -n "${SERVER_IMAGE:-}" ]; then set_env SERVER_IMAGE "$SERVER_IMAGE"; pull="$pull server"; fi
if [ -n "${CLIENT_IMAGE:-}" ]; then set_env CLIENT_IMAGE "$CLIENT_IMAGE"; pull="$pull client"; fi

# Caller passes SERVER_IMAGE/CLIENT_IMAGE empty (not absent) when that side did not change. Compose
# resolves ${VAR:-default} from the process environment before --env-file, so an *empty* exported
# variable would shadow the real value just written to $ENV_FILE and force compose back onto
# docker-compose.prod.yml's unpushable `:latest` default. Unsetting lets compose read $ENV_FILE instead.
[ -n "${SERVER_IMAGE:-}" ] || unset SERVER_IMAGE
[ -n "${CLIENT_IMAGE:-}" ] || unset CLIENT_IMAGE

# This script always runs with --no-build, so compose can never fall back to building locally. If either
# image is somehow missing from $ENV_FILE (e.g. a run that only touched one side left the other unset),
# stop here rather than let `up` recreate that container against docker-compose.prod.yml's unpushable
# `culture-quest-*:latest` default - that would destroy a healthy container instead of leaving it alone.
for name in SERVER_IMAGE CLIENT_IMAGE; do
  if [ -z "$(env_value "$name")" ]; then
    echo "Refusing to deploy: $ENV_FILE has no $name set, and this script never builds images locally." >&2
    exit 1
  fi
done

if [ -n "$pull" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
  # shellcheck disable=SC2086
  $dc pull -q $pull
  docker logout ghcr.io >/dev/null
fi

# Compose only recreates services whose image or config changed; mongo keeps running otherwise.
$dc up -d --no-build

port=$(env_value WEB_PORT); port=${port:-8080}
healthy() {
  i=0
  while [ $i -lt 24 ]; do
    curl -fsS -o /dev/null "http://127.0.0.1:$port/api/health" && return 0
    i=$((i + 1)); sleep 5
  done
  return 1
}

if ! healthy; then
  echo "Deploy is unhealthy, rolling back" >&2
  $dc logs --tail 40 server >&2 || true
  set_env SERVER_IMAGE "$previous_server"
  set_env CLIENT_IMAGE "$previous_client"
  # Same shadowing as above: unset so this up reads the just-restored values from $ENV_FILE, not
  # whatever (now-broken) image this run originally exported.
  unset SERVER_IMAGE CLIENT_IMAGE
  $dc up -d --no-build
  exit 1
fi
echo "Healthy"

# Keep only the images now in use for this app; other projects on the VPS are untouched.
current_server=$(env_value SERVER_IMAGE)
current_client=$(env_value CLIENT_IMAGE)
for image in $current_server $current_client; do
  docker images "${image%:*}" --format '{{.Repository}}:{{.Tag}}' | grep -vxF -e "$current_server" -e "$current_client" | xargs -r docker rmi >/dev/null 2>&1 || true
done
# Images built on the VPS before CI/CD existed; docker refuses to remove the one still in use.
docker rmi culture-quest-server:latest culture-quest-client:latest >/dev/null 2>&1 || true
docker image prune -f >/dev/null
