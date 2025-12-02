# Multi-stage production build for the account service
FROM golang:1.23 AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/accountsvc ./account/cmd/accountsvc

FROM debian:12-slim AS runtime
ENV CONFIG_PATH=/etc/xcontrol/account/account.yaml \
    PORT=8080

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/accountsvc /usr/local/bin/accountsvc
COPY account/config/account.yaml /etc/xcontrol/account/account.yaml

RUN <<'SCRIPT' > /usr/local/bin/account-entrypoint.sh
#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${CONFIG_PATH:-/etc/xcontrol/account/account.yaml}"
DEFAULT_CONFIG="/etc/xcontrol/account/account.yaml"
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

exec /usr/local/bin/accountsvc --config "${CONFIG_FILE}" "$@"
SCRIPT

RUN chmod +x /usr/local/bin/account-entrypoint.sh

VOLUME ["/etc/xcontrol/account"]
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/account-entrypoint.sh"]
CMD []
