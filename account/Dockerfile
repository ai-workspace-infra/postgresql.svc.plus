# Multi-stage production build for the account service

ARG GO_BASE_IMAGE

FROM ${GO_BASE_IMAGE} AS builder
WORKDIR /src
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates make \
    && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/account ./account/cmd/account

# PROD Image

FROM ${GO_BASE_IMAGE} AS runtime

ENV CONFIG_PATH=/etc/xcontrol/account/account.yaml \
    PORT=8080

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/account /usr/local/bin/account
COPY account/config/account.yaml /etc/xcontrol/account/account.yaml
COPY account-entrypoint.sh /usr/local/bin/account-entrypoint.sh
RUN chmod +x /usr/local/bin/account-entrypoint.sh

VOLUME ["/etc/xcontrol/account"]
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/account-entrypoint.sh"]
CMD []
