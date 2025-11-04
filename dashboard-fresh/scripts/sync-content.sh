#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)
CONTENT_DIR="${REPO_ROOT}/content"
REMOTE_REPO="${CONTENT_REMOTE_REPO:-}"
REMOTE_BRANCH="${CONTENT_REMOTE_BRANCH:-main}"
REMOTE_SUBDIR="${CONTENT_REMOTE_SUBDIR:-content}"

usage() {
  cat <<USAGE
Usage: $(basename "$0") <push|pull>

Environment variables:
  CONTENT_REMOTE_REPO   Git URL or local path of the external content repository (required)
  CONTENT_REMOTE_BRANCH Branch to sync (default: main)
  CONTENT_REMOTE_SUBDIR Subdirectory inside the external repo to mirror content/ (default: content)
  GIT_AUTHOR_NAME       Author name used for commits when pushing (default: Content Sync Bot)
  GIT_AUTHOR_EMAIL      Author email used for commits when pushing (default: content-sync@example.com)
USAGE
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

MODE="$1"

if [[ -z "${REMOTE_REPO}" ]]; then
  echo "CONTENT_REMOTE_REPO is required" >&2
  exit 1
fi

if [[ ! -d "${CONTENT_DIR}" ]]; then
  echo "Content directory not found: ${CONTENT_DIR}" >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT

clone_repo() {
  git clone --depth=1 --branch "${REMOTE_BRANCH}" "${REMOTE_REPO}" "${TMP_DIR}/repo" >/dev/null 2>&1 || \
    git clone --depth=1 "${REMOTE_REPO}" "${TMP_DIR}/repo"
  (cd "${TMP_DIR}/repo" && git checkout "${REMOTE_BRANCH}" >/dev/null 2>&1 || git checkout -b "${REMOTE_BRANCH}")
}

sync_push() {
  clone_repo
  mkdir -p "${TMP_DIR}/repo/${REMOTE_SUBDIR}"
  rsync -a --delete "${CONTENT_DIR}/" "${TMP_DIR}/repo/${REMOTE_SUBDIR}/"
  (
    cd "${TMP_DIR}/repo"
    if [[ -n "$(git status --porcelain)" ]]; then
      git config user.name "${GIT_AUTHOR_NAME:-Content Sync Bot}"
      git config user.email "${GIT_AUTHOR_EMAIL:-content-sync@example.com}"
      git add "${REMOTE_SUBDIR}"
      git commit -m "chore(content): sync from dashboard"
      git push origin "${REMOTE_BRANCH}"
    else
      echo "No changes to push"
    fi
  )
}

sync_pull() {
  clone_repo
  if [[ ! -d "${TMP_DIR}/repo/${REMOTE_SUBDIR}" ]]; then
    echo "Remote repository does not contain ${REMOTE_SUBDIR}" >&2
    exit 1
  fi
  rsync -a --delete "${TMP_DIR}/repo/${REMOTE_SUBDIR}/" "${CONTENT_DIR}/"
}

case "${MODE}" in
  push)
    sync_push
    ;;
  pull)
    sync_pull
    ;;
  *)
    usage
    exit 1
    ;;
esac
