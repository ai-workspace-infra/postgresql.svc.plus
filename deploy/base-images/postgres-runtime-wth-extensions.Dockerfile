# ---------------------------------------------------------
# Stage 0 — Add PGDG Repo (Ubuntu 24.04 rootfs is already slim)
# ---------------------------------------------------------
FROM ubuntu:24.04 AS pgdg-base

ARG PG_MAJOR=16
ENV DEBIAN_FRONTEND=noninteractive

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        wget curl gnupg ca-certificates lsb-release; \
    \
    mkdir -p /usr/share/keyrings /etc/apt/keyrings; \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | gpg --dearmor >/usr/share/keyrings/pgdg.gpg; \
    \
    echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] \
        http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list; \
    apt-get update;


# ---------------------------------------------------------
# Stage 1 — Build Extensions: pg_jieba / pg_cache
# ---------------------------------------------------------
FROM pgdg-base AS builder

ARG PG_JIEBA_REPO=https://github.com/jaiminpan/pg_jieba.git
ARG PG_CACHE_REPO=https://github.com/jaiminpan/pg_cache.git
ARG PG_MAJOR=16

RUN set -eux; \
    apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        pkg-config \
        libicu-dev \
        postgresql-server-dev-${PG_MAJOR}; \
    \
    temp_dir="$(mktemp -d)"; \
    \
    # ------------------------------
    # Build pg_jieba
    # ------------------------------
    git clone --depth 1 --recurse-submodules "${PG_JIEBA_REPO}" "$temp_dir/pg_jieba"; \
    cmake -S "$temp_dir/pg_jieba" -B "$temp_dir/pg_jieba/build" \
        -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/${PG_MAJOR}/server; \
    cmake --build "$temp_dir/pg_jieba/build" --config Release -- -j"$(nproc)"; \
    cmake --install "$temp_dir/pg_jieba/build"; \
    \
    # ------------------------------
    # Build pg_cache
    # ------------------------------
    git clone --depth 1 "${PG_CACHE_REPO}" "$temp_dir/pg_cache"; \
    make -C "$temp_dir/pg_cache" \
        PG_CONFIG=/usr/lib/postgresql/${PG_MAJOR}/bin/pg_config -j"$(nproc)"; \
    make -C "$temp_dir/pg_cache" \
        PG_CONFIG=/usr/lib/postgresql/${PG_MAJOR}/bin/pg_config install; \
    \
    rm -rf "$temp_dir";


# ---------------------------------------------------------
# Stage 2 — Runtime (Ubuntu 24.04 + PG16 + pgvector)
# ---------------------------------------------------------
FROM pgdg-base AS runtime

LABEL maintainer="XControl" \
      description="PostgreSQL 16 + pgvector + pg_jieba + pg_cache (Ubuntu 24.04 Runtime)"

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

# ------------------------------
# Copy compiled extensions
# ------------------------------
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/*.so \
                    /usr/lib/postgresql/${PG_MAJOR}/lib/

COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension \
                    /usr/share/postgresql/${PG_MAJOR}/extension

USER postgres
EXPOSE 5432

CMD ["postgres"]
