#!/usr/bin/env bash
set -euo pipefail

CHART_DIR="${1:-${CHART_DIR:-deploy/helm/postgresql}}"
REGISTRY="${2:-${REGISTRY:-ghcr.io}}"
OCI_NAMESPACE="${3:-${OCI_NAMESPACE:-x-evor/charts}}"
TOKEN="${4:-${GHCR_TOKEN:-}}"
USERNAME="${5:-${GHCR_USERNAME:-}}"

if [ -n "${TOKEN}" ]; then
  echo "${TOKEN}" | helm registry login "${REGISTRY}" --username "${USERNAME}" --password-stdin
fi

chart_name="$(awk '/^name:/ { print $2; exit }' "${CHART_DIR}/Chart.yaml")"
chart_version="${CHART_VERSION:-}"
if [[ -z "${chart_version}" ]]; then
  chart_version="$(awk '/^version:/ { print $2; exit }' "${CHART_DIR}/Chart.yaml")"
fi
package_dir="$(mktemp -d)"

helm package "${CHART_DIR}" --version "${chart_version}" --destination "${package_dir}"

chart_archive="${package_dir}/${chart_name}-${chart_version}.tgz"
if [ ! -f "${chart_archive}" ]; then
  echo "Chart archive not found: ${chart_archive}" >&2
  exit 1
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "chart_name=${chart_name}" >> "${GITHUB_OUTPUT}"
  echo "chart_version=${chart_version}" >> "${GITHUB_OUTPUT}"
  echo "chart_archive=${chart_archive}" >> "${GITHUB_OUTPUT}"
fi

helm push "${chart_archive}" "oci://${REGISTRY}/${OCI_NAMESPACE}"
