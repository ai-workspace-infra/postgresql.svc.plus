#!/usr/bin/env bash
#
# Cross-platform OpenResty installer (Linux & macOS)
# Supports amd64/x86_64 and arm64/aarch64
#
set -euo pipefail

OPENRESTY_VERSION="1.27.1.2"
PREFIX="/usr/local/openresty"
OPENRESTY_URL="https://openresty.org/download/openresty-${OPENRESTY_VERSION}.tar.gz"
TMP_DIR="/tmp/openresty-install"

if [[ $(id -u) -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

OS=$(uname -s)
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64)
    OPENRESTY_ARCH="amd64"
    ;;
  arm64|aarch64)
    OPENRESTY_ARCH="arm64"
    ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

echo "Detected OS: $OS"
echo "Detected architecture: $OPENRESTY_ARCH"

ensure_tmp_dir() {
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
}

install_linux_deps() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "Installing build dependencies with apt..."
    $SUDO apt-get update -y
    $SUDO apt-get install -y build-essential libpcre3 libpcre3-dev zlib1g-dev libssl-dev perl curl tar make
  elif command -v dnf >/dev/null 2>&1; then
    echo "Installing build dependencies with dnf..."
    $SUDO dnf install -y gcc gcc-c++ make pcre pcre-devel openssl openssl-devel zlib zlib-devel perl curl tar
  elif command -v yum >/dev/null 2>&1; then
    echo "Installing build dependencies with yum..."
    $SUDO yum install -y gcc gcc-c++ make pcre pcre-devel openssl openssl-devel zlib zlib-devel perl curl tar
  elif command -v pacman >/dev/null 2>&1; then
    echo "Installing build dependencies with pacman..."
    $SUDO pacman -Sy --noconfirm base-devel pcre pcre2 openssl zlib perl curl tar
  else
    echo "Unsupported Linux distribution: unable to detect package manager" >&2
    exit 1
  fi
}

ensure_swap_if_needed() {
  local mem_total
  mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
  if [[ -n "$mem_total" && "$mem_total" -lt 2097152 ]]; then
    echo "Memory less than 2GB detected, setting up 1GB swap..."
    if ! $SUDO swapon --show | grep -q '/swapfile'; then
      $SUDO fallocate -l 1G /swapfile || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=1024
      $SUDO chmod 600 /swapfile
      $SUDO mkswap /swapfile
      $SUDO swapon /swapfile
      if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
      fi
    fi
  fi
}

install_macos_deps() {
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is required on macOS. Install it from https://brew.sh first." >&2
    exit 1
  fi
  echo "Installing build dependencies with Homebrew..."
  brew update
  brew install openssl@3 pcre perl wget || true
}

build_and_install_openresty() {
  ensure_tmp_dir
  pushd "$TMP_DIR" >/dev/null

  echo "Downloading OpenResty ${OPENRESTY_VERSION}..."
  curl -fSL "$OPENRESTY_URL" -o openresty.tar.gz

  echo "Extracting sources..."
  tar -xf openresty.tar.gz
  cd "openresty-${OPENRESTY_VERSION}"

  CONFIGURE_PREFIX="$PREFIX"
  if [[ "$OS" == "Darwin" ]]; then
    OPENSSL_DIR=$(brew --prefix openssl@3)
    export PATH="${OPENSSL_DIR}/bin:$PATH"
    export CPPFLAGS="-I${OPENSSL_DIR}/include"
    export LDFLAGS="-L${OPENSSL_DIR}/lib"
  fi

  echo "Configuring build..."
  ./configure \
    --prefix="${CONFIGURE_PREFIX}" \
    --with-pcre-jit \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-stream_ssl_module \
    --with-http_realip_module \
    --with-http_stub_status_module

  CORES=1
  if command -v nproc >/dev/null 2>&1; then
    CORES=$(nproc)
  elif [[ "$OS" == "Darwin" ]]; then
    CORES=$(sysctl -n hw.ncpu)
  fi

  echo "Building with ${CORES} core(s)..."
  make -j"${CORES}" || { echo "Parallel build failed, retrying single-threaded"; make; }

  echo "Installing OpenResty..."
  $SUDO make install

  popd >/dev/null
  rm -rf "$TMP_DIR"
}

setup_systemd_service() {
  echo "Configuring systemd service..."
  $SUDO tee /etc/systemd/system/openresty.service >/dev/null <<'EOF'
[Unit]
Description=OpenResty Web Platform
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/openresty/nginx/sbin/nginx
ExecReload=/usr/local/openresty/nginx/sbin/nginx -s reload
ExecStop=/usr/local/openresty/nginx/sbin/nginx -s quit
PIDFile=/usr/local/openresty/nginx/logs/nginx.pid
PrivateTmp=true
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

  $SUDO systemctl daemon-reload
  $SUDO systemctl enable openresty || true
  $SUDO systemctl restart openresty || true
}

create_default_configs() {
  echo "Creating default nginx configuration..."
  $SUDO mkdir -p ${PREFIX}/nginx/conf/conf.d
  $SUDO tee ${PREFIX}/nginx/conf/nginx.conf >/dev/null <<'EOF'
worker_processes  auto;
error_log  logs/error.log warn;
pid        logs/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    gzip  on;

    access_log logs/access.log;

    include conf.d/*.conf;
}
EOF

  $SUDO tee ${PREFIX}/nginx/conf/conf.d/default.conf >/dev/null <<'EOF'
server {
    listen 80;
    server_name localhost;

    location / {
        root html;
        index index.html index.htm;
    }

    location /status {
        stub_status;
        allow 127.0.0.1;
        deny all;
    }
}
EOF
}

verify_installation() {
  if [[ ! -x ${PREFIX}/nginx/sbin/nginx ]]; then
    echo "OpenResty binary not found at ${PREFIX}/nginx/sbin/nginx" >&2
    exit 1
  fi
  echo "OpenResty installation completed."
  ${PREFIX}/nginx/sbin/nginx -V 2>&1 | head -n 5
}

case "$OS" in
  Linux)
    install_linux_deps
    ensure_swap_if_needed
    ;;
  Darwin)
    install_macos_deps
    ;;
  *)
    echo "Unsupported operating system: $OS" >&2
    exit 1
    ;;
esac

build_and_install_openresty
create_default_configs

if [[ "$OS" == "Linux" ]]; then
  setup_systemd_service
fi

verify_installation
