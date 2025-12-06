#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.yaml"

usage() {
  echo "Usage: $0 {up|init|certbot|reset|down}"
  exit 1
}

stop_all() {
  docker compose -f "${COMPOSE_FILE}" down -v || true
}

case "${1:-}" in
  up)
    docker compose -f "${COMPOSE_FILE}" up -d --build
    ;;
  init)
    docker compose -f "${COMPOSE_FILE}" up -d db redis
    docker compose -f "${COMPOSE_FILE}" --profile init run --rm init
    ;;
  certbot)
    docker compose -f "${COMPOSE_FILE}" --profile bootstrap up --abort-on-container-exit certbot
    ;;
  reset)
    stop_all
    rm -rf ./certbot/conf/live ./certbot/www
    mkdir -p ./certbot/conf/live ./certbot/www
    ;;
  down)
    stop_all
    ;;
  *)
    usage
    ;;
esac
