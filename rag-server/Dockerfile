# =======================================================
# Stage 1 — Builder
# =======================================================
ARG GO_RUNTIME_IMAGE
FROM ${GO_RUNTIME_IMAGE} AS builder

WORKDIR /src

COPY . .
RUN make build


# =======================================================
# Stage 2 — Runtime
# =======================================================
ARG GO_RUNTIME_IMAGE
FROM ${GO_RUNTIME_IMAGE} AS runtime

ENV CONFIG_PATH=/etc/xcontrol/rag-server.yaml \
    PORT=8090

# ---- Install minimal dependencies for runtime ----------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/rag-server /usr/local/bin/rag-server
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/etc/xcontrol/"]
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
