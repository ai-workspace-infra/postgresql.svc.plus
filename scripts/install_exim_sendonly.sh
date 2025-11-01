#!/usr/bin/env bash
#
# install_exim_sendonly.sh v3.8-stable
# Exim4 + OpenDKIM + TLS + SASL（send-only）
# --------------------------------------------------------
# 🧩 改进特性：
#   ✅ 自动检测并强制启用 587（submission）端口
#   ✅ OpenDKIM PID / Socket 稳定化
#   ✅ 自有 SSL 证书优先，打印有效期
#   ✅ DKIM 输出自动分行，兼容阿里云 / Cloudflare
#   ✅ 保留完整 --help 提示
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
SASL_PASS_FILE="/etc/exim4/passwd"
TMP_PASS="$(openssl rand -base64 12)"

ACTION="${1:-help}"
TO_EMAIL="${2:-}"

log(){ echo -e "\033[1;36m$*\033[0m"; }
die(){ echo "❌ $*"; exit 1; }
check_root(){ [ "$EUID" -eq 0 ] || die "请用 root 运行"; }

# ------------------ 安装依赖 ------------------
ensure_packages(){
  log "📦 安装依赖..."
  apt update -qq
  DEBIAN_FRONTEND=noninteractive apt install -y \
    exim4-daemon-heavy mailutils \
    opendkim opendkim-tools \
    sasl2-bin libsasl2-modules \
    dnsutils curl openssl
}

# ------------------ SSL 检测 ------------------
verify_cert(){
  if [[ -f "$CERT" && -f "$KEY" ]]; then
    log "🔐 使用自有 SSL 证书：$CERT"
    openssl x509 -noout -subject -dates -in "$CERT" || true
  else
    log "⚠️ 未检测到 /etc/ssl/${DOMAIN}.pem/key，将使用默认自签名"
  fi
}

# ------------------ Exim 主配置 ------------------
deploy_exim(){
  verify_cert
  log "🚀 写入 Debconf 主配置（split 模式）..."
  tee /etc/exim4/update-exim4.conf.conf >/dev/null <<EOF
dc_eximconfig_configtype='internet'
dc_other_hostnames='${HOSTNAME}'
dc_local_interfaces='0.0.0.0'
dc_readhost='${DOMAIN}'
dc_relay_domains=''
dc_minimaldns='false'
dc_relay_nets=''
dc_smarthost=''
CFILEMODE='644'
dc_use_split_config='true'
dc_hide_mailname='true'
dc_mailname_in_oh='true'
dc_localdelivery='mail_spool'
EOF

  log "🧩 注入 MAIN_* 宏..."
  mkdir -p /etc/exim4/conf.d/main
  tee /etc/exim4/exim4.conf.localmacros >/dev/null <<EOF
MAIN_HARDCODE_PRIMARY_HOSTNAME = ${HOSTNAME}
MAIN_TLS_ENABLE = true
MAIN_TLS_CERTIFICATE = ${CERT}
MAIN_TLS_PRIVATEKEY  = ${KEY}
MAIN_TLS_ADVERTISE_HOSTS = *
MAIN_DAEMON_SMTP_PORTS = 25 : 587
MAIN_TLS_ON_CONNECT_PORTS = 465
MAIN_FORCE_IPV4 = yes
MAIN_MILTER = inet:localhost:8891
MAIN_MILTER_COMMAND_TIMEOUT = 30s
MAIN_MILTER_CONNECT_TIMEOUT = 5s
MAIN_MILTER_MAIL_MACROS = i {mail_addr} {client_addr} {client_name} {auth_type} {auth_authen}
MAIN_MILTER_RCPT_MACROS = i {rcpt_addr}
EOF
}

inject_main_block(){
  local F="/etc/exim4/conf.d/main/02_exim4-config_options"
  log "🛠 注入 MAIN 宏展开片段..."
  grep -q "MAIN_DAEMON_SMTP_PORTS" "$F" || cat <<'EOF' >> "$F"

# --- Added by install_exim_sendonly.sh (ports) ---
.ifdef MAIN_DAEMON_SMTP_PORTS
daemon_smtp_ports = MAIN_DAEMON_SMTP_PORTS
.endif
.ifdef MAIN_TLS_ON_CONNECT_PORTS
tls_on_connect_ports = MAIN_TLS_ON_CONNECT_PORTS
.endif
.ifdef MAIN_TLS_ADVERTISE_HOSTS
tls_advertise_hosts = MAIN_TLS_ADVERTISE_HOSTS
.endif
# --- End (ports) ---
EOF

  grep -q "MAIN_MILTER" "$F" || cat <<'EOF' >> "$F"
# --- Added by install_exim_sendonly.sh (milter) ---
.ifdef MAIN_MILTER
milter = MAIN_MILTER
milter_command_timeout = MAIN_MILTER_COMMAND_TIMEOUT
milter_connect_timeout = MAIN_MILTER_CONNECT_TIMEOUT
milter_mail_macros = MAIN_MILTER_MAIL_MACROS
milter_rcpt_macros = MAIN_MILTER_RCPT_MACROS
.endif
# --- End (milter) ---
EOF
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

  tee /etc/opendkim.conf >/dev/null <<EOF
Syslog yes
UMask 002
Mode sv
Background yes
PidFile /run/opendkim/opendkim.pid
Canonicalization relaxed/simple
SubDomains no
KeyTable /etc/opendkim/key.table
SigningTable /etc/opendkim/signing.table
ExternalIgnoreList refile:/etc/opendkim/trusted.hosts
InternalHosts refile:/etc/opendkim/trusted.hosts
Socket inet:8891@localhost
UserID opendkim
EOF

  tee /etc/opendkim/key.table >/dev/null <<EOF
${DKIM_SELECTOR}._domainkey.${DOMAIN} ${DOMAIN}:${DKIM_SELECTOR}:${DKIM_KEY_DIR}/${DKIM_SELECTOR}.private
EOF
  tee /etc/opendkim/signing.table >/dev/null <<EOF
*@${DOMAIN} ${DKIM_SELECTOR}._domainkey.${DOMAIN}
EOF
  tee /etc/opendkim/trusted.hosts >/dev/null <<EOF
127.0.0.1
localhost
${DOMAIN}
EOF
  chown -R opendkim:opendkim /etc/opendkim
}

# ------------------ SASL ------------------
deploy_sasl(){
  log "🔐 配置 SASL..."
  local HASHED_PASS
  HASHED_PASS="$(openssl passwd -apr1 "${TMP_PASS}")"
  echo "${EMAIL}:${HASHED_PASS}" > "${SASL_PASS_FILE}"
  chown root:Debian-exim "${SASL_PASS_FILE}"
  chmod 640 "${SASL_PASS_FILE}"
}

# ------------------ 启用自管 AUTH 登录 ------------------
enable_auth_login() {
  log "🧩 启用自管 AUTH LOGIN / PLAIN 模式..."

  mkdir -p /etc/exim4/conf.d/auth

  # 禁用系统自带的 PLAIN server，避免命名冲突
  if [ -f /etc/exim4/conf.d/auth/30_exim4-config_plain_server ]; then
    mv /etc/exim4/conf.d/auth/30_exim4-config_plain_server \
       /etc/exim4/conf.d/auth/30_exim4-config_plain_server.disabled 2>/dev/null || true
  fi

  # 写入自定义 authenticator
  tee /etc/exim4/conf.d/auth/30_local_login >/dev/null <<'EOF'
# --- Added by install_exim_sendonly.sh (AUTH LOGIN/PLAIN) ---
local_plain:
  driver = plaintext
  public_name = LOCAL_PLAIN
  server_condition = ${if crypteq{$auth2}{${extract{2}{:}{${lookup{$auth1}lsearch{/etc/exim4/passwd}{$value}{no}}}}}}{yes}{no}}
  server_set_id = $auth1

local_login:
  driver = plaintext
  public_name = LOGIN
  server_prompts = "Username:: : Password::"
  server_condition = ${if crypteq{$auth2}{${extract{2}{:}{${lookup{$auth1}lsearch{/etc/exim4/passwd}{$value}{no}}}}}}{yes}{no}}
  server_set_id = $auth1
# --- End (AUTH) ---
EOF

  update-exim4.conf
  systemctl restart exim4

  if swaks --server 127.0.0.1:587 --quit-after EHLO 2>/dev/null | grep -q "AUTH"; then
    log "✅ AUTH LOGIN 已启用"
  else
    log "⚠️ AUTH 未广播，请检查 /etc/exim4/conf.d/auth/30_local_login"
  fi
}

# ------------------ 重启与 fallback ------------------
build_and_restart(){
  log "⚙️ 生成配置并重启..."
  systemctl daemon-reexec
  systemctl daemon-reload
  systemctl enable opendkim
  systemctl restart opendkim
  update-exim4.conf || true
  systemctl restart exim4

  # ---- 强制 fallback 修复 ----
  sleep 1
  if ! ss -tlnp | grep -E '(:587)\s' >/dev/null; then
    log "⚠️ Exim 未监听 587，强制追加 fallback..."
    local F="/etc/exim4/conf.d/main/02_exim4-config_options"
    cat <<'EOF' >> "$F"

# --- Fallback added by install_exim_sendonly.sh v3.8 ---
daemon_smtp_ports = 25 : 587
tls_on_connect_ports = 465
tls_advertise_hosts = *
# --- End fallback ---
EOF
    update-exim4.conf || true
    systemctl restart exim4
  fi

  if ss -tlnp | grep -E '(:25|:587)\s' >/dev/null; then
    log "✅ Exim 已监听 25 与 587 端口"
  else
    log "❌ Exim 未监听 587，请检查 /etc/exim4/conf.d/main/02_exim4-config_options"
  fi
}

# ------------------ DNS 输出 ------------------
show_dns_record(){
  log "🌐 生成最小可信 DNS 模板..."
  local DKIM_TXT DKIM_PUB LINE LEN=255
  if [[ -f "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt" ]]; then
    DKIM_TXT=$(tr -d '\n' < "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt" | sed 's/"//g' | tr -d '\r')
    DKIM_PUB=$(echo "${DKIM_TXT}" | sed -n 's/.*p=\(.*\)$/\1/p' | tr -d ' ')
  else
    DKIM_PUB="<DKIM 公钥未生成>"
  fi

  echo
  echo "🌐 DNS 模板（兼容阿里云 / Cloudflare）"
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
  echo "HELO  (EHLO/HELO 输出应为 ${HOSTNAME})"
  echo "----------------------------------------------------------"
}

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

# ------------------ 自检 ------------------
check_self(){
  log "🔍 自检 SPF / DKIM / DMARC / rDNS / HELO / 端口 ..."
  echo
  echo "SPF:";   dig +short TXT ${DOMAIN} | grep -i spf || echo "⚠️ 未配置 SPF"; echo
  echo "DKIM:";  dig +short TXT ${DKIM_SELECTOR}._domainkey.${DOMAIN} || echo "⚠️ 未配置 DKIM"; echo
  echo "DMARC:"; dig +short TXT _dmarc.${DOMAIN} || echo "⚠️ 未配置 DMARC"; echo
  echo "rDNS:";  dig +short -x ${SERVER_IP} || echo "⚠️ 未配置反向解析"; echo
  echo "端口监听："; ss -tlnp | grep -E '(:25|:465|:587)\s' || echo "⚠️ SMTP 未监听全部端口"; echo
  echo "OpenDKIM 8891："; ss -tlnp | grep ':8891 ' || echo "⚠️ 8891 未监听"; echo
  echo "OpenDKIM testkey："; opendkim-testkey -d "${DOMAIN}" -s "${DKIM_SELECTOR}" -vvv || true
}

enforce_tls_certificate() {
  log "🔒 强制加载自有 TLS 证书 (${CERT})..."
  sed -i '/tls_certificate/d' /etc/exim4/conf.d/main/02_exim4-config_options 2>/dev/null || true
  sed -i '/tls_privatekey/d' /etc/exim4/conf.d/main/02_exim4-config_options 2>/dev/null || true

  echo "tls_certificate = ${CERT}" >> /etc/exim4/conf.d/main/02_exim4-config_options
  echo "tls_privatekey = ${KEY}"   >> /etc/exim4/conf.d/main/02_exim4-config_options

  update-exim4.conf
  systemctl restart exim4

  log "✅ 已更新并加载 ${CERT} (${HOSTNAME})"
}

set_auth_credentials() {
  local USERNAME="${1:-${EMAIL}}"
  local PLAINTEXT="${2:-${TMP_PASS}}"

  [ -n "$USERNAME" ] || die "USERNAME 不能为空"
  [ -n "$PLAINTEXT" ] || die "PASSWORD 不能为空"

  log "🔐 写入 AUTH 凭据（哈希）到 /etc/exim4/passwd ..."
  # 使用 SHA-512 crypt 取代 MD5 apr1
  local HASH
  HASH="$(openssl passwd -6 "${PLAINTEXT}")"
  printf '%s:x:%s\n' "${USERNAME}" "${HASH}" > /etc/exim4/passwd
  chown root:Debian-exim /etc/exim4/passwd
  chmod 640 /etc/exim4/passwd

  # 自测哈希匹配
  local PROBE
  PROBE="$(exim -be "\${if crypteq{${PLAINTEXT}}{${HASH}}{yes}{no}}")" || PROBE="no"
  if [ "$PROBE" = "yes" ]; then
    log "✅ 密码哈希校验通过（SHA-512 crypt）"
  else
    die "❌ 密码哈希校验失败，请检查 openssl passwd 生成是否异常"
  fi

  update-exim4.conf
  systemctl restart exim4
}

# ------------------ 卸载 ------------------
uninstall_reset(){
  log "🧹 停止并清理（不碰 /etc/ssl/*）..."
  systemctl stop exim4 || true
  systemctl stop opendkim || true
  rm -rf /etc/exim4 /var/spool/exim4 /var/log/exim4
  rm -rf /etc/opendkim /var/run/opendkim
  apt purge -y exim4* opendkim* mailutils sasl2-bin || true
  apt autoremove -y || true
  log "✅ 已清理完成（证书未动）。"
}

# ------------------ 主流程 ------------------
check_root
case "${ACTION}" in
  deploy)
    ensure_packages
    deploy_exim
    inject_main_block
    deploy_dkim
    deploy_sasl
    enforce_tls_certificate
    set_auth_credentials
    enable_auth_login
    build_and_restart
    show_dns_record
    show_app_config
    ;;
  upgrade)
    log "⬆️ 更新配置并重启..."
    deploy_exim
    inject_main_block
    deploy_dkim
    deploy_sasl
    enforce_tls_certificate
    set_auth_credentials
    enable_auth_login
    build_and_restart
    show_dns_record
    show_app_config
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
      self)
        check_self
        ;;
      send_email)
        send_test_email() {
          local TO="${3:-}"
          [ -z "$TO" ] && die "请提供收件人邮箱"
          log "📧 发送测试邮件到 ${TO}..."
          echo "Test from ${EMAIL}" | mail -s "✅ Exim Send-Only + DKIM + TLS Test" "$TO"
          echo
          echo "📄 查看日志：tail -n 30 /var/log/exim4/mainlog"
        }
        send_test_email "$@"
        ;;
      *)
        echo "用法: $0 check {self|send_email 收件人邮箱}"
        ;;
    esac
    ;;
  uninstall|reset)
    uninstall_reset
    ;;
  help|--help|-h)
    echo "用法: $0 {deploy|upgrade|show dns_record|check self|uninstall}"
    ;;
  *)
    echo "用法: $0 {deploy|upgrade|show dns_record|check self|uninstall}"
    ;;
esac

