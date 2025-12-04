FROM ubuntu:24.04

LABEL maintainer="XControl" \
      description="Slim Ubuntu runtime base for Go services with TLS certificates"

ENV CGO_ENABLED=0

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["/bin/sh"]
