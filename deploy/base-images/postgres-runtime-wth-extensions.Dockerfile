# ---------------------------------------------------------
# Stage 0 — Add PGDG Repo (Ubuntu 24.04)
# ---------------------------------------------------------
FROM ubuntu:24.04 AS pgdg-base

ARG PG_MAJOR=16
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
# Stage 1 — Build Extensions: pg_jieba + pgmq (SQL-only)
# ---------------------------------------------------------
FROM pgdg-base AS builder

ARG PG_MAJOR=16
ARG PG_JIEBA_REPO=https://github.com/jaiminpan/pg_jieba.git
ARG PGMQ_VERSION=0.18.2

RUN set -eux; \
    apt-get install -y --no-install-recommends \
        build-essential cmake git pkg-config libicu-dev \
        postgresql-server-dev-${PG_MAJOR}; \
    temp_dir="$(mktemp -d)";

# ---------------------------------------------------------
# Build pg_jieba
# ---------------------------------------------------------
RUN git clone --depth 1 "${PG_JIEBA_REPO}" "$temp_dir/pg_jieba"; \
    cd "$temp_dir/pg_jieba"; \
    git submodule update --init --recursive --depth 1 || true; \
    ln -s "$temp_dir/pg_jieba/third_party/cppjieba" \
          "$temp_dir/pg_jieba/cppjieba"; \
    cmake -S "$temp_dir/pg_jieba" \
          -B "$temp_dir/pg_jieba/build" \
          -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/${PG_MAJOR}/server; \
    cmake --build "$temp_dir/pg_jieba/build" --config Release -- -j"$(nproc)"; \
    cmake --install "$temp_dir/pg_jieba/build";

# ---------------------------------------------------------
# Install pgmq (SQL-only extension)
# ---------------------------------------------------------
RUN mkdir -p "$temp_dir/pgmq"; \
    curl -fsSL -o "$temp_dir/pgmq/pgmq.zip" \
      "https://github.com/tembo-io/pgmq/archive/refs/tags/v${PGMQ_VERSION}.zip"; \
    unzip "$temp_dir/pgmq/pgmq.zip" -d "$temp_dir/pgmq"; \
    cp "$temp_dir/pgmq/pgmq-${PGMQ_VERSION}/sql/pgmq.control" \
       /usr/share/postgresql/${PG_MAJOR}/extension/; \
    cp "$temp_dir/pgmq/pgmq-${PGMQ_VERSION}/sql/"*.sql \
       /usr/share/postgresql/${PG_MAJOR}/extension/;

RUN rm -rf "$temp_dir";

# ---------------------------------------------------------
# Stage 2 — Runtime
# ---------------------------------------------------------
FROM pgdg-base AS runtime

LABEL maintainer="XControl" \
      description="PostgreSQL 16 + pgvector + pg_jieba + pgmq (Ubuntu 24.04 Runtime)"

ARG PG_MAJOR=16
ARG PGVECTOR_PACKAGE=postgresql-16-pgvector
ENV DEBIAN_FRONTEND=noninteractive

RUN set -eux; \
    apt-get install -y --no-install-recommends \
        postgresql-${PG_MAJOR} \
        postgresql-client-${PG_MAJOR} \
        postgresql-contrib-${PG_MAJOR} \
        ${PGVECTOR_PACKAGE}; \
    rm -rf /var/lib/apt/lists/*;

# ---------------------------------------------------------
# Copy compiled shared libraries (*.so)
# ---------------------------------------------------------
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/*.so \
                    /usr/lib/postgresql/${PG_MAJOR}/lib/

# ---------------------------------------------------------
# Copy extension sql/control files
# ---------------------------------------------------------
COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension \
                    /usr/share/postgresql/${PG_MAJOR}/extension

USER postgres
EXPOSE 5432

CMD ["postgres"]
