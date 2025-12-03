# ------------------------------
# Stage 1 — Build Extensions
# ------------------------------
FROM postgres:16 AS builder

ARG PG_JIEBA_REPO=https://github.com/jaiminpan/pg_jieba.git
ARG PG_CACHE_REPO=https://github.com/jaiminpan/pg_cache.git
ENV PG_MAJOR=16

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        cmake \
        git \
        libicu-dev \
        pkg-config \
        postgresql-server-dev-${PG_MAJOR} \
        wget; \
    \
    # ------------------------------
    # Build pg_jieba
    # ------------------------------
    temp_dir="$(mktemp -d)"; \
    git clone --depth 1 "${PG_JIEBA_REPO}" "$temp_dir/pg_jieba"; \
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
    rm -rf "$temp_dir"


# ------------------------------
# Stage 2 — Runtime Image
# ------------------------------
FROM postgres:16 AS runtime

LABEL maintainer="XControl" \
      description="PostgreSQL 16 with pgvector, pg_jieba, and pg_cache extensions"

ARG PGVECTOR_PACKAGE=postgresql-16-pgvector
ENV PG_MAJOR=16

# Install pgvector only — no build deps
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ${PGVECTOR_PACKAGE}; \
    rm -rf /var/lib/apt/lists/*

# ------------------------------
# Copy Extensions from Builder
# ------------------------------
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/*.so \
                    /usr/lib/postgresql/${PG_MAJOR}/lib/

COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension \
                    /usr/share/postgresql/${PG_MAJOR}/extension

# Multi-stage完毕
CMD ["postgres"]
