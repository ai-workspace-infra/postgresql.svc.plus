#!/usr/bin/env bash
set -euo pipefail

EVENT_NAME="${1:-${GITHUB_EVENT_NAME:-}}"
REF="${2:-${GITHUB_REF:-}}"
INPUT_ENVIRONMENT="${3:-}"
# workflow_dispatch/workflow_call 的 push_latest input, 直接用 ${{ inputs.push_latest }}
# 展开传入 —— 在 push/pull_request 触发下 GHA 不会展开 inputs.*(那个 context
# 在这两种事件里不存在), 于是参数里收到的是字面量空字符串, 与"未传参"
# 无法区分, 只能靠下面的 EVENT_NAME 分支兜底。
INPUT_PUSH_LATEST="${4:-}"

if [ "${EVENT_NAME}" = "workflow_dispatch" ] || [ "${EVENT_NAME}" = "workflow_call" ]; then
  case "${INPUT_ENVIRONMENT}" in
    sit|uat|prod)
      ENV="${INPUT_ENVIRONMENT}"
      ;;
    *)
      ENV="uat"
      ;;
  esac
elif [ "${EVENT_NAME}" = "pull_request" ]; then
  ENV="sit"
elif [[ "${REF}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  ENV="prod"
elif [ "${REF}" = "refs/heads/main" ]; then
  ENV="uat"
else
  # Vault OIDC roles for uat and prod require main or release/* refs.
  # Custom or feature branches must use sit to satisfy Vault claim validation.
  ENV="sit"
fi

# push_latest 曾经在 metadata-action 里直接写 ${{ inputs.push_latest }} ——
# inputs 这个 context 只在 workflow_dispatch/workflow_call 触发时存在, 普通
# push 触发时它是 null, 直接插值渲染成空字符串而不是 false, 传给
# metadata-action 的 enable= 就成了非法值, 报 "Invalid value for enable
# attribute"。这里统一算成一个明确的 true/false, 再作为 job output 传递。
#
# 语义与其余四个业务仓(resolve-pipeline-flags.sh)一致: 只有 push 到 uat 线
# (main)才推 latest, 避免 prod 发版顺手把 uat 在用的指针挪走;
# workflow_dispatch / workflow_call 尊重显式传入的值; PR 永远不推。
if [ "${EVENT_NAME}" = "pull_request" ]; then
  PUSH_LATEST=false
elif [ "${EVENT_NAME}" = "workflow_dispatch" ] || [ "${EVENT_NAME}" = "workflow_call" ]; then
  [ "${INPUT_PUSH_LATEST}" = "true" ] && PUSH_LATEST=true || PUSH_LATEST=false
elif [ "${EVENT_NAME}" = "push" ] && [ "${ENV}" = "uat" ]; then
  PUSH_LATEST=true
else
  PUSH_LATEST=false
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "environment=${ENV}" >> "${GITHUB_OUTPUT}"
  echo "push_latest=${PUSH_LATEST}" >> "${GITHUB_OUTPUT}"
fi

echo "Resolved environment: ${ENV}"
echo "Resolved push_latest: ${PUSH_LATEST}"
