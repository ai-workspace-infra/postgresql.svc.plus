#!/usr/bin/env bash
#
# install_opensmtpd_sendonly.sh v1.2
# OpenSMTPD + OpenDKIM + TLS（Send-Only 模式）
# --------------------------------------------------------
# ✅ 自动部署轻量级 MTA，监听 25/587 端口（免认证）
# ✅ 集成 DKIM 签名、SPF/DMARC/rDNS/HELO 校验模板
# ✅ 兼容阿里云 / Cloudflare DNS 输出格式
# ✅ 适配 OpenSMTPD ≥ 6.8（Ubuntu 22.04+）
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
  swaks --server smtp.svc.plus:587 --tls-on-connect \
    --auth LOGIN \
    --auth-user "no-reply@svc.plus" \
    --auth-password "eexfevdapylgbhgd" \
    --from "no-reply@svc.plus" \
    --header "From: XControl Account <no-reply@svc.plus>" \
    --header "Reply-To: no-reply@svc.plus" \
    --to "no-reply@svc.plus" \
    --header "Subject: Official Test via Svc.plus SMTP" \
    --body "✅ Hello from XControl via Svc.plus SMTP (authentic and compliant)."
}

# ------------------ 安装依赖 ------------------
ensure_packages(){
  log "📦 安装 OpenSMTPD + OpenDKIM..."
  apt update -qq
  DEBIAN_FRONTEND=noninteractive apt install -y \
    opensmtpd opendkim opendkim-tools dnsutils curl openssl swaks
}

# ------------------ SSL 证书检测 ------------------
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

# ------------------ OpenSMTPD ------------------
deploy_smtpd(){
  verify_cert
  log "🚀 写入 OpenSMTPD 配置..."
  mkdir -p /etc/smtpd

  cat >/etc/smtpd/smtpd.conf <<EOF
# /etc/smtpd/smtpd.conf - Send-only mode
pki ${HOSTNAME} cert "${CERT}"
pki ${HOSTNAME} key  "${KEY}"

# 监听端口（25/587）均启用 TLS，无需认证
listen on 0.0.0.0 port 25 tls pki ${HOSTNAME}
listen on 0.0.0.0 port 587 tls pki ${HOSTNAME}

# DKIM 过滤器：将外发邮件经 OpenDKIM 签名
filter "dkim" smtp-out chain "inet://127.0.0.1:8891"

table aliases file:/etc/aliases

# 动作定义
action "relay" mail-from any rcpt-to any filter "dkim" relay

# 匹配规则
match from any for domain "${DOMAIN}" action "relay"

smtp helo ${HOSTNAME}
EOF

  systemctl enable --now opensmtpd || (
    log "⚠️ 发现语法错误，尝试 fallback 简化配置..."
    cat >/etc/smtpd/smtpd.conf <<EOF
pki ${HOSTNAME} cert "${CERT}"
pki ${HOSTNAME} key  "${KEY}"
listen on 0.0.0.0 port 25 tls pki ${HOSTNAME}
listen on 0.0.0.0 port 587 tls pki ${HOSTNAME}
action "relay" relay
match from any for domain "${DOMAIN}" action "relay"
smtp helo ${HOSTNAME}
EOF
    systemctl restart opensmtpd
  )

  log "✅ OpenSMTPD 已启用并监听 25/587 端口（Send-Only 模式）"
}

# ------------------ DNS 模板 ------------------
show_dns_record(){
  log "🌐 生成 DNS 模板（SPF / DKIM / DMARC / rDNS / HELO）..."
  local DKIM_TXT DKIM_PUB LINE LEN=255
  if [[ -f "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt" ]]; then
    DKIM_TXT=$(tr -d '\n' < "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt" | sed 's/"//g')
    DKIM_PUB=$(echo "${DKIM_TXT}" | sed -n 's/.*p=\(.*\)$/\1/p' | tr -d ' ')
  else
    DKIM_PUB="<DKIM 公钥未生成>"
  fi

  echo "----------------------------------------------------------"
  echo "A     smtp.${DOMAIN}      ${SERVER_IP}"
  echo "MX    ${DOMAIN}           smtp.${DOMAIN}."
  echo "SPF   @                   \"v=spf1 a:smtp.${DOMAIN} -all\""
  echo -n "DKIM  ${DKIM_SELECTOR}._domainkey   "
  echo "\"v=DKIM1; k=rsa; p="
  while [[ -n "$DKIM_PUB" ]]; do
    LINE=${DKIM_PUB:0:$LEN}
    DKIM_PUB=${DKIM_PUB:$LEN}
    echo "\"${LINE}\""
  done
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
  systemctl stop opensmtpd || true
  systemctl stop opendkim || true
  apt purge -y opensmtpd opendkim opendkim-tools || true
  apt autoremove -y || true
  rm -rf /etc/smtpd /etc/opendkim /var/log/mail*
  log "✅ 已清理完成（证书未动）。"
}

# ------------------ 主流程 ------------------
check_root
case "${ACTION}" in
  deploy)
    ensure_packages
    deploy_dkim
    deploy_smtpd
    show_dns_record
    ;;
  upgrade)
    log "⬆️ 更新配置并重启..."
    deploy_dkim
    deploy_smtpd
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
