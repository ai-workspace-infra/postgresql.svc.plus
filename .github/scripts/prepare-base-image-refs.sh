#!/usr/bin/env bash
set -euo pipefail

REGISTRY=${REGISTRY:?REGISTRY is required}
ORG=${ORG:?ORG is required}

declare -A IMAGES=(
  [GO_RUNTIME_DIGEST]="go-runtime"
  [NODE_BUILDER_DIGEST]="node-builder"
  [NODE_RUNTIME_DIGEST]="node-runtime"
  [OPENRESTY_GEOIP_DIGEST]="openresty-geoip"
  [POSTGRES_RUNTIME_DIGEST]="postgres-runtime"
)

write_image_ref() {
  local env_name=$1
  local digest=$2
  local image=$3
  local ref

  if [[ -n "$digest" ]]; then
    ref="${REGISTRY}/${ORG}/${image}@${digest}"
  else
    ref="${REGISTRY}/${ORG}/${image}:main"
  fi

  echo "${env_name}=${ref}" >> "${GITHUB_ENV}"
}

for digest_var in "${!IMAGES[@]}"; do
  image_name=${IMAGES[${digest_var}]}
  digest_value=${!digest_var-}
  write_image_ref "${digest_var/_DIGEST/_IMAGE_REF}" "${digest_value}" "${image_name}"
done
