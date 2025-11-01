#!/usr/bin/env bash
#
# install_stalwart_mailserver.sh v2.3
# --------------------------------------------------------
# ✅ 安装 Stalwart Mail Server（Rust版，官方 install.sh）
# ✅ SMTPS(465) + IMAPS(993)，全程 TLS-only
# ✅ 支持 S3 / MinIO 存储
# ✅ 支持 JSON 用户认证（默认）
# ✅ 自动生成 DKIM + SPF/DMARC DNS 模板
# ✅ Systemd 管理
# ✅ 无 WebUI（由外部 Dashboard 对接）
# --------------------------------------------------------
# Author: Pan Haitao @ svc.plus
#

set -euo pipefail

DOMAIN="svc.plus"
HOSTNAME="mail.${DOMAIN}"
SERVER_IP="$(curl -s https://api.ipify.org || echo 127.0.0.1)"

CERT_DIR="/etc/ssl"
CERT="${CERT_DIR}/${DOMAIN}.pem"
KEY="${CERT_DIR}/${DOMAIN}.key"

STALWART_DIR="/etc/stalwart"
STALWART_BIN="/usr/local/bin/stalwart-mail"
STALWART_CFG="${STALWART_DIR}/stalwart.toml"
DKIM_KEY_DIR="${STALWART_DIR}/dkim"
DKIM_SELECTOR="mail"

SERVICE_USER="stalwart"
SERVICE_GROUP="stalwart"
ACTION="${1:-help}"

# S3 存储参数
S3_ENDPOINT="https://minio.svc.plus:9000"
S3_BUCKET="svcplus-mail"
S3_ACCESS_KEY="MINIO_ACCESS_KEY"
S3_SECRET_KEY="MINIO_SECRET_KEY"

ADMIN_EMAIL="admin@${DOMAIN}"

log(){ echo -e "\033[1;36m$*\033[0m"; }
die(){ echo "❌ $*"; exit 1; }
check_root(){ [ "$EUID" -eq 0 ] || die "请以 root 运行"; }

# ------------------ 依赖 ------------------
ensure_packages(){
  log "📦 安装依赖..."
  apt update -qq
  apt install -y curl openssl jq dnsutils opendkim opendkim-tools swaks tar
}

# ------------------ 安装 Stalwart ------------------
install_stalwart(){
  if ! command -v stalwart-mail &>/dev/null; then
    log "⬇️ 通过官方脚本安装 Stalwart Mail Server..."
    curl --proto '=https' --tlsv1.2 -sSf https://get.stalw.art/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
  else
    log "✅ 已检测到 Stalwart：$(stalwart-mail --version)"
  fi
}

# ------------------ 证书 ------------------
verify_cert(){
  mkdir -p "$CERT_DIR"
  if [[ -f "$CERT" && -f "$KEY" ]]; then
    log "🔐 使用现有证书"
  else
    log "⚠️ 未检测到证书，生成自签..."
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -subj "/CN=${HOSTNAME}" -keyout "$KEY" -out "$CERT"
  fi
}

# ------------------ DKIM ------------------
deploy_dkim(){
  log "🔏 生成 DKIM 密钥..."
  mkdir -p "${DKIM_KEY_DIR}"
  cd "${DKIM_KEY_DIR}"
  if [ ! -f "${DKIM_SELECTOR}.private" ]; then
    opendkim-genkey -s "${DKIM_SELECTOR}" -d "${DOMAIN}"
    chmod 600 "${DKIM_SELECTOR}.private"
  fi
}

# ------------------ 配置文件 ------------------
generate_config(){
  log "⚙️ 生成 stalwart.toml..."
  mkdir -p "${STALWART_DIR}"

  cat >"${STALWART_CFG}" <<EOF
# =====================================================
# Stalwart Mail Server Configuration (Core Only)
# =====================================================
[server]
hostname = "${HOSTNAME}"
data-dir = "/var/lib/stalwart"
user = "${SERVICE_USER}"

[tls]
cert = "${CERT}"
key  = "${KEY}"

# SMTPS 465
[smtp]
listen = ["0.0.0.0:465"]
require_tls = true
tls_implicit = true
auth = "users"

# IMAPS 993
[imap]
listen = ["0.0.0.0:993"]
require_tls = true
auth = "users"

# 存储后端（S3/MinIO）
[store]
backend = "s3"
bucket = "${S3_BUCKET}"
endpoint = "${S3_ENDPOINT}"
access-key = "${S3_ACCESS_KEY}"
secret-key = "${S3_SECRET_KEY}"
region = "us-east-1"
path-style = true
tls = true

# JSON 用户认证
[auth.users]
backend = "json"
path = "${STALWART_DIR}/users.json"

# DKIM
[dns.dkim]
selector = "${DKIM_SELECTOR}"
private-key = "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.private"
domain = "${DOMAIN}"

# Metrics & Logs
[metrics]
listen = ["127.0.0.1:9090"]

[log]
level = "info"
output = "journald"
EOF

  # 默认账户
  if [[ ! -f "${STALWART_DIR}/users.json" ]]; then
    cat >"${STALWART_DIR}/users.json" <<JSON
{
  "users": [
    {
      "email": "demo@${DOMAIN}",
      "password": "\$2y\$12\$1UZ7dEK3T2xKqacbPO5KUOJdyq8JcKAAwPKZt8SKmwbT39IM7Ch1O"
    }
  ]
}
JSON
    log "✅ 默认账户：demo@${DOMAIN} / 密码：demo123"
  fi
}

# ------------------ Systemd ------------------
setup_systemd(){
  log "🧩 配置 systemd 服务..."
  cat >/etc/systemd/system/stalwart.service <<EOF
[Unit]
Description=Stalwart Mail Server (Core)
After=network-online.target

[Service]
ExecStart=${STALWART_BIN} serve -c ${STALWART_CFG}
Restart=on-failure
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

  id "${SERVICE_USER}" &>/dev/null || useradd -r -s /bin/false "${SERVICE_USER}"
  chown -R "${SERVICE_USER}:${SERVICE_GROUP}" "${STALWART_DIR}" /var/lib/stalwart || true
  systemctl daemon-reload
  systemctl enable --now stalwart.service
}

# ------------------ DNS 模板 ------------------
show_dns_record(){
  log "🌐 DNS 模板（SPF / DKIM / DMARC / rDNS）"
  local DKIM_FILE="${DKIM_KEY_DIR}/${DKIM_SELECTOR}.txt"
  local DKIM_VAL="<未生成>"
  [[ -f "$DKIM_FILE" ]] && DKIM_VAL=$(grep -v '^;' "$DKIM_FILE" | tr -d '\n' | sed -E 's/.*p=//;s/"//g')
  cat <<EOF
----------------------------------------------------------
A      mail.${DOMAIN}        ${SERVER_IP}
MX     ${DOMAIN}             mail.${DOMAIN}.
SPF    @                    "v=spf1 a:mail.${DOMAIN} -all"
DKIM   ${DKIM_SELECTOR}._domainkey   "v=DKIM1; k=rsa; p=${DKIM_VAL}"
DMARC  _dmarc                "v=DMARC1; p=none; rua=mailto:postmaster@${DOMAIN}"
rDNS   (反向解析 ${SERVER_IP} -> ${HOSTNAME})
HELO   (应输出 ${HOSTNAME})
----------------------------------------------------------
EOF
}

# ------------------ 应用端配置 ------------------
show_app_config(){
  cat <<EOF
📦 应用端配置：
----------------------------------------------------------
IMAP:
  host: ${HOSTNAME}
  port: 993
  username: demo@${DOMAIN}
  password: demo123
  tls: true

SMTP:
  host: ${HOSTNAME}
  port: 465
  username: demo@${DOMAIN}
  password: demo123
  tls: true
----------------------------------------------------------
EOF
}

# ------------------ 检查 ------------------
check_self(){
  log "🔍 检查服务状态..."
  systemctl is-active --quiet stalwart && log "✅ stalwart 正在运行" || die "❌ 未运行"
  ss -tlnp | grep -E ':465|:993' || die "❌ 端口未监听"
  log "✅ 服务运行正常"
}

check_send_email(){
  log "✉️ 测试发信..."
  swaks --server "${HOSTNAME}:465" \
    --tls --auth LOGIN \
    --auth-user "demo@${DOMAIN}" \
    --auth-password "demo123" \
    --from "demo@${DOMAIN}" \
    --to "${ADMIN_EMAIL}" \
    --header "Subject: ✅ Stalwart 测试 $(date '+%F %T')" \
    --body "测试发信成功 $(date '+%F %T')"
}

# ------------------ 卸载 ------------------
uninstall_reset(){
  log "🧹 卸载 Stalwart..."
  systemctl disable --now stalwart || true
  rm -f /etc/systemd/system/stalwart.service
  rm -rf "${STALWART_DIR}" /var/lib/stalwart
  log "✅ 已清理完成（证书保留）"
}

# ------------------ 主逻辑 ------------------
check_root
case "${ACTION}" in
  deploy)
    ensure_packages
    install_stalwart
    verify_cert
    deploy_dkim
    generate_config
    setup_systemd
    show_dns_record ;;
  upgrade)
    log "⬆️ 升级并重启..."
    systemctl stop stalwart || true
    install_stalwart
    generate_config
    systemctl restart stalwart
    show_dns_record ;;
  show)
    case "${2:-}" in
      dns_record) show_dns_record ;;
      app_config) show_app_config ;;
      *) echo "用法: $0 show {dns_record|app_config}" ;;
    esac ;;
  check)
    case "${2:-}" in
      self) check_self ;;
      send_email) check_send_email ;;
      *) echo "用法: $0 check {self|send_email}" ;;
    esac ;;
  uninstall|reset)
    uninstall_reset ;;
  help|--help|-h|*)
    echo "用法: $0 {deploy|upgrade|show {dns_record|app_config}|check {self|send_email}|uninstall}" ;;
esac
