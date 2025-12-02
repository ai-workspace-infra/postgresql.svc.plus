FROM openresty/openresty:1.25.3.2-0-bullseye

LABEL maintainer="XControl" \
      description="OpenResty base image with GeoIP2 libraries and lua-resty-maxminddb"

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        libmaxminddb0 libmaxminddb-dev mmdb-bin \
        build-essential git luarocks; \
    luarocks install lua-resty-maxminddb; \
    apt-get purge -y --auto-remove build-essential git luarocks; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

CMD ["nginx", "-g", "daemon off;"]
