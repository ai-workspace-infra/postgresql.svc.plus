#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

POSTGRES_VOL="postgres_data"

stop_all() {
  docker compose -f docker-compose.yaml down -v || true
}

wait_db() {
  until docker exec "$(docker ps -qf 'ancestor=postgres:17-alpine')" \
      pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
  done
}

case "${1:-}" in
  certbot)
    docker compose -f docker-compose.yaml run --rm certbot
    ;;
  init)
    stop_all
    docker compose -f docker-compose.yaml run --rm zitadel-init
    docker compose -f docker-compose.yaml up -d
    ;;

  update)
    docker compose -f docker-compose.yaml pull
    docker compose -f docker-compose.yaml up -d
    ;;

  reset)
    stop_all

    docker volume rm -f "${POSTGRES_VOL}" || true
    rm -rf ./data && mkdir -p ./data
    ;;

  *)
    echo "Usage: $0 {init|update|reset|certbot}"
    exit 1
    ;;
esac
