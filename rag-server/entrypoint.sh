#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${CONFIG_PATH:-/etc/xcontrol/rag-server/server.yaml}"
DEFAULT_CONFIG="/etc/xcontrol/rag-server/server.yaml"
mkdir -p "$(dirname "${CONFIG_FILE}")"

if [ ! -f "${CONFIG_FILE}" ]; then
  cp "${DEFAULT_CONFIG}" "${CONFIG_FILE}"
fi

if [ -n "${PORT:-}" ]; then
  tmp_cfg=$(mktemp)
  awk -v port="$PORT" '
    /^server:/ {print; in_server=1; addr_written=0; next}
    in_server && /^  addr:/ {print "  addr: \":" port "\""; addr_written=1; next}
    in_server && /^ [^ ]/ {in_server=0}
    {print}
    END {
      if (port != "" && in_server == 0 && addr_written == 0) {
        print "server:";
        print "  addr: \":" port "\"";
      }
    }
  ' "${CONFIG_FILE}" > "${tmp_cfg}"
  CONFIG_FILE="${tmp_cfg}"
fi

exec /usr/local/bin/xcontrol-server --config "${CONFIG_FILE}" "$@"
