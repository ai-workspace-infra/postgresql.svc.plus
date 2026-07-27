FROM alpine:3.21

LABEL org.opencontainers.image.title="stunnel client runtime" \
      org.opencontainers.image.description="Minimal stunnel image for PostgreSQL TLS tunnel client" \
      org.opencontainers.image.source="https://github.com/ai-workspace-infra/postgresql.svc.plus"

RUN set -eux; \
    apk add --no-cache ca-certificates stunnel; \
    grep -q '^stunnel:' /etc/group || addgroup -S stunnel; \
    id -u stunnel >/dev/null 2>&1 || adduser -S -D -H -G stunnel -s /sbin/nologin stunnel; \
    mkdir -p /etc/stunnel/certs /var/log/stunnel /var/run/stunnel; \
    chown -R stunnel:stunnel /etc/stunnel /var/log/stunnel /var/run/stunnel; \
    chmod 755 /etc/stunnel /etc/stunnel/certs; \
    chmod 777 /var/log/stunnel /var/run/stunnel

COPY --chown=stunnel:stunnel stunnel-client.conf.example /etc/stunnel/stunnel.conf.example

USER stunnel

EXPOSE 15432

ENTRYPOINT ["stunnel"]
CMD ["/etc/stunnel/stunnel.conf"]
