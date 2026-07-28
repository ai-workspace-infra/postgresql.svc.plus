#!/usr/bin/env bash
set -euo pipefail

release_tag="${RELEASE_TAG:-${GITHUB_REF_NAME:-snapshot}}"
assets_dir="${RUNNER_TEMP}/release-assets"
mkdir -p "${assets_dir}"

if [[ -n "${RELEASE_BUILD_COMMAND:-}" ]]; then
  bash -c "${RELEASE_BUILD_COMMAND}"
fi

copy_release_files() {
  local dir
  IFS=':' read -r -a dirs <<< "${RELEASE_INPUT_DIRS:-dist:build:bin:release}"
  for dir in "${dirs[@]}"; do
    [[ -d "${dir}" ]] || continue
    while IFS= read -r -d '' file; do
      cp "${file}" "${assets_dir}/$(basename "${file}")"
    done < <(find "${dir}" -type f \( -name '*.bin' -o -name '*.zip' -o -name '*.tgz' -o -name '*.tar.gz' -o -name '*.tar.zst' \) -print0)
  done
}

copy_release_files

if [[ -n "${CHART_DIR:-}" ]]; then
  helm package "${CHART_DIR}" --version "${CHART_VERSION}" --destination "${assets_dir}" >/dev/null
fi

files_json="$(find "${assets_dir}" -maxdepth 1 -type f -print | sed 's#^.*/##' | jq -Rsc 'split("\\n") | map(select(length > 0))')"
jq -n \
  --arg repository "${GITHUB_REPOSITORY}" \
  --arg commit "${GITHUB_SHA}" \
  --arg tag "${release_tag}" \
  --arg image_refs "${IMAGE_REFS:-}" \
  --arg chart_refs "${CHART_REFS:-}" \
  --argjson files "${files_json}" \
  '{schema: 1, repository: $repository, commit: $commit, tag: $tag, image_refs: ($image_refs | split("\\n") | map(select(length > 0))), chart_refs: ($chart_refs | split("\\n") | map(select(length > 0))), files: $files}' \
  > "${assets_dir}/release-manifest.json"

printf '%s\n' "${assets_dir}"

if [[ "${GITHUB_REF_TYPE:-}" == "tag" ]]; then
  gh release view "${release_tag}" >/dev/null 2>&1 || \
    gh release create "${release_tag}" --title "${GITHUB_REPOSITORY} ${release_tag}" --notes "Automated CI release for ${GITHUB_SHA}."
  gh release upload "${release_tag}" "${assets_dir}"/* --clobber
fi
