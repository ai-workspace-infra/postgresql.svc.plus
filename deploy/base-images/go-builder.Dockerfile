FROM ubuntu:24.04

LABEL maintainer="XControl" \
      description="Go 1.23 builder image with common dependencies for XControl services"

ENV GO_VERSION=1.23.8 \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    PATH=/usr/local/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        build-essential; \
    rm -rf /var/lib/apt/lists/*; \
    curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -o /tmp/go.tgz; \
    tar -C /usr/local -xzf /tmp/go.tgz; \
    rm /tmp/go.tgz

WORKDIR /workspace

CMD ["bash"]
