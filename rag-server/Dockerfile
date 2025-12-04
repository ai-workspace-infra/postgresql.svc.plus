# Multi-stage production build for the RAG server
ARG GO_RUNTIME_IMAGE
FROM ${GO_RUNTIME_IMAGE} AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/xcontrol-rag ./rag-server/cmd/xcontrol-server

FROM ${GO_RUNTIME_IMAGE} AS runtime

ENV CONFIG_PATH=/etc/xcontrol/rag-server.yaml PORT=8090

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/xcontrol-rag /usr/local/bin/rag-server
COPY rag-server/config/server.yaml /etc/xcontrol/rag-server.yaml
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/etc/xcontrol/"]
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
