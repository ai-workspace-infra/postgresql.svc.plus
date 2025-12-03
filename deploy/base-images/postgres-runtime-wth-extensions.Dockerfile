# ---------------------------------------------------------
# Version Definitions (Can be overridden by build args)
# ---------------------------------------------------------
ARG PG_MAJOR=16
ARG PG_VERSION=16.4

# Extension versions
ARG PG_JIEBA_VERSION=v2.0.1           # or commit SHA
ARG PG_VECTOR_VERSION=v0.8.1
ARG PGMQ_VERSION=v1.8.0

# ---------------------------------------------------------
# Stage 0 — Base with PGDG Repository
# ---------------------------------------------------------
FROM ubuntu:24.04 AS pgdg-base
ARG PG_MAJOR
ARG PG_VERSION
ENV DEBIAN_FRONTEND=noninteractive

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        wget curl gnupg ca-certificates lsb-release unzip; \
    mkdir -p /usr/share/keyrings; \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | gpg --dearmor >/usr/share/keyrings/pgdg.gpg; \
    echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] \
        http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list; \
    apt-get update;

# ---------------------------------------------------------
# Stage 1 — Build Extensions (pg_jieba + pgmq + pgvector)
# ---------------------------------------------------------
FROM pgdg-base AS builder
ARG PG_MAJOR
ARG PG_JIEBA_VERSION
ARG PG_VECTOR_VERSION
ARG PGMQ_VERSION

RUN set -eux; \
    apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        pkg-config \
        libicu-dev \
        postgresql-server-dev-${PG_MAJOR}

# ---------------------------------------------------------
# Build pg_jieba
# ---------------------------------------------------------
RUN tmp=$(mktemp -d) && \
    git clone --branch "${PG_JIEBA_VERSION}" \
        https://github.com/jaiminpan/pg_jieba.git "$tmp/pg_jieba" && \
    cd "$tmp/pg_jieba" && \
    git submodule update --init --recursive || true && \
    ln -s "$tmp/pg_jieba/third_party/cppjieba" "$tmp/pg_jieba/cppjieba" && \
    cmake -S "$tmp/pg_jieba" \
          -B "$tmp/pg_jieba/build" \
          -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/${PG_MAJOR}/server && \
    cmake --build "$tmp/pg_jieba/build" --config Release -- -j"$(nproc)" && \
    cmake --install "$tmp/pg_jieba/build" && \
    rm -rf "$tmp"

# ---------------------------------------------------------
# Build pgmq
# ---------------------------------------------------------
RUN tmp=$(mktemp -d) && \
    git clone --depth 1 --branch "${PGMQ_VERSION}" \
        https://github.com/tembo-io/pgmq.git "$tmp/pgmq" && \
    cd "$tmp/pgmq/pgmq-extension" && \
    make && make install && \
    rm -rf "$tmp"

# ---------------------------------------------------------
# Build pgvector
# ---------------------------------------------------------
RUN tmp=$(mktemp -d) && \
    git clone --depth 1 --branch "${PG_VECTOR_VERSION}" \
        https://github.com/pgvector/pgvector.git "$tmp/pgvector" && \
    cd "$tmp/pgvector" && \
    make && make install && \
    rm -rf "$tmp"

# ---------------------------------------------------------
# Stage 2 — Runtime
# ---------------------------------------------------------
FROM pgdg-base AS runtime
ARG PG_MAJOR
ARG PG_VERSION

LABEL maintainer="Cloud-Neutral Toolkit" \
      description="PostgreSQL ${PG_VERSION} + pgvector + pg_jieba + pgmq"

ENV DEBIAN_FRONTEND=noninteractive

RUN set -eux; \
    apt-get install -y --no-install-recommends \
        postgresql-${PG_MAJOR} \
        postgresql-client-${PG_MAJOR} \
        postgresql-contrib-${PG_MAJOR}; \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------
# Copy .so + extension files from builder
# ---------------------------------------------------------
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/ \
                    /usr/lib/postgresql/${PG_MAJOR}/lib/

COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension/ \
                    /usr/share/postgresql/${PG_MAJOR}/extension/

USER postgres
EXPOSE 5432

CMD ["postgres"]
