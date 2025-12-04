# ------------------------------
# Stage 1 — Build
# ------------------------------
ARG GO_BASE_IMAGE
FROM ${GO_BASE_IMAGE} AS builder

WORKDIR /src

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates make \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN make build && make -pv /out/ && cp account /out/

# ------------------------------
# Stage 2 — Runtime
# ------------------------------
ARG GO_BASE_IMAGE
FROM ${GO_BASE_IMAGE} AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/account /usr/local/bin/account
COPY account-entrypoint.sh /usr/local/bin/account-entrypoint.sh
RUN mkdir -p /etc/xcontrol/ && chmod +x /usr/local/bin/account-entrypoint.sh

VOLUME ["/etc/xcontrol/"]

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/account-entrypoint.sh"]
CMD []
