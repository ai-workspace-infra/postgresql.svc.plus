#!/usr/bin/env bash
#
# install_postfix_sendonly.sh v1.0
# Postfix + OpenDKIM + SPF + DMARC（Send-Only 模式）
# --------------------------------------------------------
# ✅ 自动部署轻量级 Postfix 发信服务（仅 587 STARTTLS）
# ✅ 集成 DKIM 签名、SPF/DMARC/rDNS/HELO 校验模板
# ✅ 兼容阿里云 / Cloudflare DNS 输出格式
# ✅ 适配 Ubuntu / Debian / RHEL 系列系统
# --------------------------------------------------------
# Author: Pan Haitao @ svc.plus
#

set -euo pipefail

DOMAIN="svc.plus"
HOSTNAME="smtp.${DOMAIN}"
SERVER_IP="52.196.108.28"
EMAIL="no-reply@${DOMAIN}"

CERT="/etc/ssl/${DOMAIN}.pem"
KEY="/etc/ssl/${DOMAIN}.key"

DKIM_SELECTOR="mail"
DKIM_KEY_DIR="/etc/opendkim/keys/${DOMAIN}"
TMP_PASS="$(openssl rand -base64 12)"
ACTION="${1:-help}"

log(){ echo -e "\033[1;36m$*\033[0m"; }
die(){ echo "❌ $*"; exit 1; }
check_root(){ [ "$EUID" -eq 0 ] || die "请用 root 运行"; }

# ------------------ 应用端配置 ------------------
show_app_config(){
  cat <<EOF

📦 应用端 SMTP 配置：
----------------------------------------------------------
smtp:
  host: "${HOSTNAME}"
  port: 587
  username: "${EMAIL}"
  password: "${TMP_PASS}"
  from: "XControl Account <${EMAIL}>"
  tls:
    mode: "auto"
    insecureSkipVerify: false
  auth: "login"
----------------------------------------------------------
EOF
  echo "首发密码（仅本次显示）：${TMP_PASS}"
}

check_send_email(){
  local SMTP_HOST="${HOSTNAME}"
  local SMTP_PORT=587
  local SMTP_USER="${EMAIL}"
  local SMTP_PASS="${TMP_PASS}"
  local TEST_TO="${1:-${EMAIL}}"
  local SUBJECT="📨 SMTP Deliverability Test — $(date '+%Y-%m-%d %H:%M:%S')"
  local BODY="✅ Automated deliverability test from ${SMTP_HOST}

Environment:
  - HELO: $(hostname -f)
  - Source IP: $(curl -s ifconfig.me 2>/dev/null || echo 'unknown')
  - TLS: STARTTLS on ${SMTP_PORT}
  - Auth: LOGIN (${SMTP_USER})

If you received this message intact, DKIM/DMARC/SPF validation succeeded."

  echo "🔍 Testing outbound mail via ${SMTP_HOST}:${SMTP_PORT}"
  echo "-------------------------------------------------------------"
  swaks --server "${SMTP_HOST}:${SMTP_PORT}" \
    --tls --protocol ESMTP \
    --auth LOGIN \
    --auth-user "${SMTP_USER}" \
    --auth-password "${SMTP_PASS}" \
    --from "${SMTP_USER}" \
    --to "${TEST_TO}" \
    --header "From: XControl Mail System <${SMTP_USER}>" \
    --header "Subject: ${SUBJECT}" \
    --body "${BODY}" \
    --timeout 15 --quit-after "."
  echo "-------------------------------------------------------------"
}

# ------------------ 依赖 ------------------
ensure_packages(){
  log "📦 安装 Postfix + OpenDKIM..."
  export DEBIAN_FRONTEND=noninteractive
  apt update -qq
  apt install -y postfix opendkim opendkim-tools mailutils swaks dnsutils openssl curl
}

# ------------------ SSL ------------------
verify_cert(){
  if [[ -f "$CERT" && -f "$KEY" ]]; then
    log "🔐 使用自有 SSL 证书：$CERT"
    openssl x509 -noout -subject -dates -in "$CERT" || true
  else
    log "⚠️ 未检测到 ${CERT}/${KEY}，生成自签证书..."
    mkdir -p /etc/ssl
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -subj "/CN=${HOSTNAME}" -keyout "$KEY" -out "$CERT"
  fi
}

# ------------------ DKIM ------------------
deploy_dkim(){
  log "🔏 配置 OpenDKIM..."
  mkdir -p "${DKIM_KEY_DIR}"
  cd "${DKIM_KEY_DIR}"
  if [ ! -f "${DKIM_SELECTOR}.private" ]; then
    opendkim-genkey -s "${DKIM_SELECTOR}" -d "${DOMAIN}"
    chown opendkim:opendkim "${DKIM_SELECTOR}.private" "${DKIM_SELECTOR}.txt"
    chmod 600 "${DKIM_SELECTOR}.private"
  fi

  cat >/etc/opendkim.conf <<EOF
Syslog yes
UMask 002
Mode sv
Canonicalization relaxed/simple
SubDomains no
KeyTable /etc/opendkim/key.table
SigningTable /etc/opendkim/signing.table
ExternalIgnoreList refile:/etc/opendkim/trusted.hosts
InternalHosts refile:/etc/opendkim/trusted.hosts
Socket inet:8891@localhost
UserID opendkim
EOF

  cat >/etc/opendkim/key.table <<EOF
${DKIM_SELECTOR}._domainkey.${DOMAIN} ${DOMAIN}:${DKIM_SELECTOR}:${DKIM_KEY_DIR}/${DKIM_SELECTOR}.private
EOF
  cat >/etc/opendkim/signing.table <<EOF
*@${DOMAIN} ${DKIM_SELECTOR}._domainkey.${DOMAIN}
EOF
  cat >/etc/opendkim/trusted.hosts <<EOF
127.0.0.1
localhost
${DOMAIN}
EOF

  chown -R opendkim:opendkim /etc/opendkim
  systemctl enable --now opendkim
}

# ------------------ Postfix ------------------

deploy_postfix() {
  verify_cert
  log "🚀 配置 Postfix Send-only (仅启用 587 / STARTTLS)..."

  # 确保 postfix 存在
  command -v postconf >/dev/null 2>&1 || die "Postfix 未安装"

  # 主配置（禁用入站、仅发信）
  postconf -e "myhostname = ${HOSTNAME}"
  postconf -e "myorigin = ${DOMAIN}"
  postconf -e "mydestination = "
  postconf -e "relayhost = "
  postconf -e "inet_interfaces = all"
  postconf -e "inet_protocols = all"
  postconf -e "biff = no"
  postconf -e "append_dot_mydomain = no"
  postconf -e "readme_directory = no"
  postconf -e "smtpd_banner = ${HOSTNAME} ESMTP"
  postconf -e "compatibility_level = 2"
  postconf -e "mydomain = ${DOMAIN}"
  postconf -e "smtp_helo_name = ${HOSTNAME}"
  postconf -e "alias_maps = hash:/etc/aliases"
  postconf -e "alias_database = hash:/etc/aliases"
  postconf -e "mynetworks = 127.0.0.0/8 [::1]/128"
  postconf -e "relay_domains = ${DOMAIN}"

  # TLS & DKIM
  postconf -e "smtpd_tls_cert_file = ${CERT}"
  postconf -e "smtpd_tls_key_file = ${KEY}"
  postconf -e "smtpd_tls_security_level = may"
  postconf -e "smtp_tls_security_level = may"
  postconf -e "smtp_use_tls = yes"
  postconf -e "smtp_tls_note_starttls_offer = yes"
  postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
  postconf -e "smtpd_tls_auth_only = yes"
  postconf -e "milter_default_action = accept"
  postconf -e "milter_protocol = 6"
  postconf -e "smtpd_milters = inet:localhost:8891"
  postconf -e "non_smtpd_milters = inet:localhost:8891"

  # 禁用 25 端口入站，仅启用 587
  cat >/etc/postfix/master.cf <<EOF
smtp      inet  n       -       y       -       -       smtpd
# 关闭 25 端口监听
smtp      inet  n       -       n       -       -       reject

submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=no
  -o smtpd_relay_restrictions=permit_mynetworks,reject_unauth_destination
  -o milter_macro_daemon_name=ORIGINATING
EOF

  systemctl enable --now postfix
  systemctl restart postfix
  sleep 1

  # 验证监听端口
  if ss -tlnp | grep -qE ':587\s'; then
    log "✅ Postfix 已启用并仅监听 587 端口 (STARTTLS Send-Only 模式)"
  else
    die "❌ 端口 587 未成功监听，请检查日志：journalctl -xeu postfix"
  fi
}

# ------------------ DNS 模板 ------------------

show_dns_record(){
  log "🌐 生成 DNS 模板（SPF / DKIM / DMARC / rDNS / HELO）..."

  local DKIM_FILE="${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt"
  local DKIM_ONE_LINE="<DKIM 公钥未生成>"

  if [[ -f "$DKIM_FILE" ]]; then
    # 读取 DKIM 文件并清理注释、括号、引号和换行
    DKIM_ONE_LINE=$(grep -v '^;' "$DKIM_FILE" \
      | tr -d '\n' \
      | sed -E 's/[()]//g; s/"//g; s/\s+/ /g; s/IN TXT//; s/mail._domainkey.*v=/v=/; s/\s*v=DKIM1/v=DKIM1/' \
      | sed 's/ *$//')
  fi

  echo "----------------------------------------------------------"
  echo "A     smtp.${DOMAIN}      ${SERVER_IP}"
  echo "MX    ${DOMAIN}           smtp.${DOMAIN}."
  echo "SPF   @                   \"v=spf1 a:smtp.${DOMAIN} -all\""
  echo "DKIM  ${DKIM_SELECTOR}._domainkey   \"${DKIM_ONE_LINE}\""
  echo "DMARC _dmarc              \"v=DMARC1; p=none; rua=mailto:postmaster@${DOMAIN}\""
  echo "rDNS  (请让 ${SERVER_IP} 反查为 ${HOSTNAME})"
  echo "HELO  (EHLO 输出应为 ${HOSTNAME})"
  echo "----------------------------------------------------------"
}

# ------------------ 自检 ------------------
check_self(){
  log "🔍 自检 SPF / DKIM / DMARC / rDNS / 端口 ..."
  echo
  echo "SPF:";   dig +short TXT ${DOMAIN} | grep -i spf || echo "⚠️ 未配置 SPF"; echo
  echo "DKIM:";  dig +short TXT ${DKIM_SELECTOR}._domainkey.${DOMAIN} || echo "⚠️ 未配置 DKIM"; echo
  echo "DMARC:"; dig +short TXT _dmarc.${DOMAIN} || echo "⚠️ 未配置 DMARC"; echo
  echo "rDNS:";  dig +short -x ${SERVER_IP} || echo "⚠️ 未配置反向解析"; echo
  echo "端口监听："; ss -tlnp | grep -E '(:25|:587|:8891)\s' || echo "⚠️ 端口未监听"; echo
  echo "OpenDKIM testkey："; opendkim-testkey -d "${DOMAIN}" -s "${DKIM_SELECTOR}" -vvv || true
}

# ------------------ 卸载 ------------------
uninstall_reset(){
  log "🧹 停止并清理..."
  systemctl stop postfix || true
  systemctl stop opendkim || true
  apt purge -y postfix opendkim opendkim-tools || true
  apt autoremove -y || true
  rm -rf /etc/postfix /etc/opendkim /var/log/mail*
  log "✅ 已清理完成（证书未动）。"
}

# ------------------ 主流程 ------------------
check_root
case "${ACTION}" in
  deploy)
    ensure_packages
    deploy_dkim
    deploy_postfix
    show_dns_record
    ;;
  upgrade)
    log "⬆️ 更新配置并重启..."
    deploy_dkim
    deploy_postfix
    show_dns_record
    ;;
  show)
    case "${2:-}" in
      dns_record) show_dns_record ;;
      app_config) show_app_config ;;
      *) echo "用法: $0 show {dns_record|app_config}" ;;
    esac
    ;;
  check)
    case "${2:-}" in
      self) check_self ;;
      send_email) check_send_email ;;
      *) echo "用法: $0 check {self|send_email}" ;;
    esac
    ;;
  uninstall|reset)
    uninstall_reset
    ;;
  help|--help|-h)
    echo "用法: $0 {deploy|upgrade|show {dns_record|app_config}|check {self|send_email}|uninstall}"
    ;;
  *)
    echo "用法: $0 {deploy|upgrade|show {dns_record|app_config}|check {self|send_email}|uninstall}"
    ;;
esac
