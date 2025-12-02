FROM postgres:16

LABEL maintainer="XControl" \
      description="PostgreSQL 16 with pgvector, pg_jieba, and pg_cache extensions"

ARG PG_JIEBA_REPO=https://github.com/jaiminpan/pg_jieba.git
ARG PG_CACHE_REPO=https://github.com/jaiminpan/pg_cache.git
ARG PGVECTOR_PACKAGE=postgresql-16-pgvector

ENV PG_MAJOR=16

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ${PGVECTOR_PACKAGE} \
        build-essential \
        ca-certificates \
        cmake \
        git \
        libicu-dev \
        pkg-config \
        postgresql-server-dev-${PG_MAJOR} \
        wget; \
    temp_dir="$(mktemp -d)"; \
    git clone --depth 1 "${PG_JIEBA_REPO}" "$temp_dir/pg_jieba"; \
    cmake -S "$temp_dir/pg_jieba" -B "$temp_dir/pg_jieba/build" -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/${PG_MAJOR}/server; \
    cmake --build "$temp_dir/pg_jieba/build" --config Release -- -j"$(nproc)"; \
    cmake --install "$temp_dir/pg_jieba/build"; \
    git clone --depth 1 "${PG_CACHE_REPO}" "$temp_dir/pg_cache"; \
    make -C "$temp_dir/pg_cache" PG_CONFIG=/usr/lib/postgresql/${PG_MAJOR}/bin/pg_config -j"$(nproc)"; \
    make -C "$temp_dir/pg_cache" PG_CONFIG=/usr/lib/postgresql/${PG_MAJOR}/bin/pg_config install; \
    rm -rf "$temp_dir"; \
    apt-get purge -y --auto-remove build-essential git cmake pkg-config wget; \
    rm -rf /var/lib/apt/lists/*

CMD ["postgres"]
