# =======================================================
# Stage 1 — Builder
# =======================================================
FROM golang:1.22 AS builder

WORKDIR /workspace/rag-server
COPY rag-server/ .   # <-- 关键：只拷贝 rag-server 目录

RUN make build \
 && mkdir -p /out \
 && cp xcontrol-server /out/rag-server

# =======================================================
# Stage 2 — Runtime
# =======================================================
FROM ubuntu:24.04  AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/rag-server /usr/local/bin/rag-server
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/etc/xcontrol/"]
EXPOSE 8090

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
