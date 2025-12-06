FROM openresty/openresty:1.25.3.2-0-bookworm

LABEL maintainer="XControl" \
      description="OpenResty base image with GeoIP2 libraries and lua-resty-maxminddb"

RUN set -eux; \
    apt-get update && apt-get upgrade -y; \
    apt-get install -y --no-install-recommends ca-certificates libmaxminddb0 libmaxminddb-dev mmdb-bin luarocks; \
    apt-get purge -y --auto-remove build-essential git luarocks; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# OpenResty 配置（nginx.conf, conf.d/*.conf, lua/）
VOLUME ["/etc/openresty/conf"]

# GeoIP 数据目录（mmdb 文件）
VOLUME ["/usr/local/openresty/geoip"]


CMD ["nginx", "-g", "daemon off;"]
