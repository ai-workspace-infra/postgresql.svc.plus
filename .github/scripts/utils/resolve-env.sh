#!/usr/bin/env bash
set -euo pipefail

EVENT_NAME="${1:-${GITHUB_EVENT_NAME:-}}"
REF="${2:-${GITHUB_REF:-}}"

if [ "${EVENT_NAME}" = "pull_request" ]; then
  ENV="sit"
elif [[ "${REF}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  ENV="prod"
else
  ENV="uat"
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "environment=${ENV}" >> "${GITHUB_OUTPUT}"
fi

echo "Resolved environment: ${ENV}"
