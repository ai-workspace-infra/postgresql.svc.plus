#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_DIR="${ROOT_DIR}/src/config"
BASE_FILE="${CONFIG_DIR}/runtime-service-config.base.yaml"
SIT_FILE="${CONFIG_DIR}/runtime-service-config.sit.yaml"
PROD_FILE="${CONFIG_DIR}/runtime-service-config.prod.yaml"
OUTPUT_FILE="${CONFIG_DIR}/runtime-service-config.yaml"

HOSTNAME_OVERRIDE=""
ENV_OVERRIDE=""

usage() {
  cat <<'USAGE'
Usage: scripts/gen-runtime-config.sh [--hostname <hostname>] [--env <env>] [--output <path>]

Options:
  --hostname    Override the hostname used for environment detection.
  --env         Explicitly set the environment (prod|sit). Overrides hostname detection.
  --output      Output path for the merged runtime configuration. Defaults to src/config/runtime-service-config.yaml.
  -h, --help    Show this help message.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hostname)
      HOSTNAME_OVERRIDE="$2"
      shift 2
      ;;
    --env)
      ENV_OVERRIDE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      HOSTNAME_OVERRIDE="$1"
      shift 1
      ;;
  esac
done

if [[ ! -f "${BASE_FILE}" ]]; then
  echo "error: base configuration file not found at ${BASE_FILE}" >&2
  exit 1
fi

if ! command -v yq >/dev/null 2>&1; then
  echo 'error: yq is required to merge runtime configuration files' >&2
  exit 1
fi

sanitize_hostname() {
  local value="$1"
  value="${value%%/*}"
  value="${value##*://}"
  value="${value%%:*}"
  value="${value,,}"
  value="${value%.}"
  echo "$value"
}

detect_hostname() {
  if [[ -n "${HOSTNAME_OVERRIDE}" ]]; then
    sanitize_hostname "${HOSTNAME_OVERRIDE}"
    return
  fi

  if [[ -n "${RUNTIME_HOSTNAME:-}" ]]; then
    sanitize_hostname "${RUNTIME_HOSTNAME}"
    return
  fi

  if [[ -n "${NEXT_RUNTIME_HOSTNAME:-}" ]]; then
    sanitize_hostname "${NEXT_RUNTIME_HOSTNAME}"
    return
  fi

  if [[ -n "${DEPLOYMENT_HOSTNAME:-}" ]]; then
    sanitize_hostname "${DEPLOYMENT_HOSTNAME}"
    return
  fi

  if [[ -n "${VERCEL_URL:-}" ]]; then
    sanitize_hostname "${VERCEL_URL}"
    return
  fi

  if [[ -n "${NEXT_PUBLIC_VERCEL_URL:-}" ]]; then
    sanitize_hostname "${NEXT_PUBLIC_VERCEL_URL}"
    return
  fi

  if [[ -n "${URL:-}" ]]; then
    sanitize_hostname "${URL}"
    return
  fi

  if [[ -n "${HOSTNAME:-}" ]]; then
    sanitize_hostname "${HOSTNAME}"
    return
  fi

  echo ""
}

normalize_env_key() {
  local value="$1"
  value="${value//[^A-Za-z0-9]/_}"
  value="${value##_}"
  value="${value%%_}"
  echo "${value,,}"
}

detect_environment_from_hostname() {
  local hostname="$1"
  if [[ -z "${hostname}" ]]; then
    echo "prod"
    return
  fi

  if [[ "${hostname}" == dev.* || "${hostname}" == dev-* || "${hostname}" == *.dev.* ]]; then
    echo "sit"
    return
  fi

  echo "prod"
}

resolve_environment() {
  if [[ -n "${ENV_OVERRIDE}" ]]; then
    normalize_env_key "${ENV_OVERRIDE}"
    return
  fi

  local env_candidates=(
    "${RUNTIME_ENV:-}"
    "${NEXT_RUNTIME_ENV:-}"
    "${APP_ENV:-}"
    "${NODE_ENV:-}"
  )

  for candidate in "${env_candidates[@]}"; do
    if [[ -n "${candidate}" ]]; then
      local normalized
      normalized="$(normalize_env_key "${candidate}")"
      case "${normalized}" in
        prod|production|release|main)
          echo "prod"
          return
          ;;
        sit|staging|test)
          echo "sit"
          return
          ;;
      esac
    fi
  done

  local detected_hostname
  detected_hostname="$(detect_hostname)"
  detect_environment_from_hostname "${detected_hostname}"
}

detect_region() {
  local hostname="$1"
  if [[ "${hostname}" == cn-* ]]; then
    echo "CN"
    return
  fi

  if [[ "${hostname}" == global-* ]]; then
    echo "Global"
    return
  fi

  echo "Default"
}

ENVIRONMENT="$(resolve_environment)"
HOSTNAME_VALUE="$(detect_hostname)"
REGION_LABEL="$(detect_region "${HOSTNAME_VALUE}")"

case "${ENVIRONMENT}" in
  sit)
    ENV_FILE="${SIT_FILE}"
    ;;
  prod|production)
    ENV_FILE="${PROD_FILE}"
    ENVIRONMENT="prod"
    ;;
  *)
    echo "warning: unknown environment '${ENVIRONMENT}', defaulting to production" >&2
    ENV_FILE="${PROD_FILE}"
    ENVIRONMENT="prod"
    ;;
endcase

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "warning: environment configuration file '${ENV_FILE}' not found, using base configuration only" >&2
  ENV_FILE=""
fi

OUTPUT_PATH="${OUTPUT_FILE}"
if [[ "${OUTPUT_PATH}" != /* ]]; then
  OUTPUT_PATH="${ROOT_DIR}/${OUTPUT_PATH}"
fi

tmp_file="${OUTPUT_PATH}.tmp"

if [[ -n "${ENV_FILE}" ]]; then
  yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "${BASE_FILE}" "${ENV_FILE}" >"${tmp_file}"
else
  cp "${BASE_FILE}" "${tmp_file}"
fi

mv "${tmp_file}" "${OUTPUT_PATH}"

echo "Generated runtime-service-config.yaml (${ENVIRONMENT^^}${REGION_LABEL:+ / ${REGION_LABEL}}) from hostname '${HOSTNAME_VALUE:-unknown}'" >&2
