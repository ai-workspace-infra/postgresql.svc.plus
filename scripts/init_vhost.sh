#!/usr/bin/env bash
# scripts/init_vhost.sh
#
# init_vhost.sh - One-shell initialization for Vhost mode (PostgreSQL + Stunnel)
#
# Supported OS:
#   - Debian 12, 13
#   - Ubuntu 22.04, 24.04
#   - Rocky Linux 8, 9, 10
#
# Usage:
#   bash scripts/init_vhost.sh
#   OR via curl:
#   curl -fsSL https://your-repo/scripts/init_vhost.sh | bash

set -e

# Configuration
REPO_URL="https://github.com/cloud-neutral-toolkit/postgresql.svc.plus.git"
INSTALL_DIR="${HOME}/postgresql.svc.plus"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_err() { echo -e "${RED}[ERROR] $1${NC}"; }
log_step() { echo -e "${CYAN}==> $1${NC}"; }

# -----------------------------------------------------------------------------
# 1. OS Detection
# -----------------------------------------------------------------------------
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION_ID=$VERSION_ID
    else
        log_err "Cannot detect OS. /etc/os-release not found."
        exit 1
    fi

    log_info "Detected OS: $OS $VERSION_ID"

    case "$OS" in
        debian)
            if [[ "$VERSION_ID" -lt 12 ]]; then
                log_warn "Debian version $VERSION_ID might be too old (Recommended: 12+)."
            fi
            CMD_INSTALL="sudo apt-get update -y && sudo apt-get install -y"
            PKG_LIST="curl git make openssl postgresql-client"
            ;;
        ubuntu)
            # 22.04=jammy, 24.04=noble
            CMD_INSTALL="sudo apt-get update -y && sudo apt-get install -y"
            PKG_LIST="curl git make openssl postgresql-client"
            ;;
        rocky|rhel|centos|almalinux)
            CMD_INSTALL="sudo dnf install -y"
            PKG_LIST="curl git make openssl postgresql"
            ;;
        *)
            log_err "Unsupported OS: $OS. Attempting to proceed with generic assumptions..."
            CMD_INSTALL="sudo apt-get install -y || sudo yum install -y"
            PKG_LIST="curl git make"
            ;;
    esac
}

# -----------------------------------------------------------------------------
# 2. Dependency Installation
# -----------------------------------------------------------------------------
install_deps() {
    log_step "Installing system dependencies..."
    eval "$CMD_INSTALL $PKG_LIST"

    # Install Docker if missing
    if ! command -v docker &> /dev/null; then
        log_step "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        
        log_info "Starting Docker service..."
        sudo systemctl enable --now docker || true
        
        # Add current user to docker group (requires re-login to check, so we might use sudo for docker cmds later if this falls through)
        sudo usermod -aG docker "$USER" || true
    else
        log_info "Docker is already installed."
    fi

    # Ensure Docker Compose plugin
    if ! docker compose version &> /dev/null; then
        log_warn "Docker Compose V2 plugin not detected. Attempting to install..."
        # On some distros get.docker.com handles this, if not we might fail unless we install explicitly.
        # For simplicity, we assume get.docker.com or distro packages covered 'docker-compose-plugin'.
    fi
}

# -----------------------------------------------------------------------------
# 3. Project Setup
# -----------------------------------------------------------------------------
setup_project() {
    # Check if we are already inside the repo
    if [ -d ".git" ] && [ -f "Makefile" ] && [ -f "deploy/docker/docker-compose.yml" ]; then
        log_info "Already inside project root."
        PROJECT_ROOT=$(pwd)
    else
        log_step "Cloning/Updating project Repo..."
        if [ -d "$INSTALL_DIR" ]; then
            log_info "Updating existing repo at $INSTALL_DIR..."
            cd "$INSTALL_DIR"
            git pull
        else
            log_info "Cloning to $INSTALL_DIR..."
            git clone "$REPO_URL" "$INSTALL_DIR"
            cd "$INSTALL_DIR"
        fi
        PROJECT_ROOT="$INSTALL_DIR"
    fi
}

# -----------------------------------------------------------------------------
# 4. Build & Launch
# -----------------------------------------------------------------------------
launch_vhost() {
    cd "$PROJECT_ROOT"

    # Fix permissions for scripts just in case
    chmod +x deploy/docker/generate-certs.sh
    chmod +x scripts/*.sh

    log_step "[Step 1/3] Building Docker Image..."
    # Attempt build using make. Warning: requires 'docker' access.
    # If user just added to group, they might need newgrp or sudo.
    # We try with sudo command if direct fails.
    if ! make build-postgres-image; then
        log_warn "Build failed, retrying with sudo..."
        sudo make build-postgres-image
    fi

    log_step "[Step 2/3] Generating Certificates..."
    cd deploy/docker
    ./generate-certs.sh
    cd ../..

    log_step "[Step 3/3] Starting Services..."
    # We use 'docker compose' (v2) or fallback to 'docker-compose' (v1)
    DOCKER_CMD="docker compose"
    if ! docker compose version &>/dev/null; then
        if command -v docker-compose &>/dev/null; then
            DOCKER_CMD="docker-compose"
        else
            log_err "docker compose not found."
            exit 1
        fi
    fi

    # Try standard up, fallback to sudo
    if ! $DOCKER_CMD -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.tunnel.yml up -d; then
         log_warn "Docker compose failed, retrying with sudo..."
         sudo $DOCKER_CMD -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.tunnel.yml up -d
    fi
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------
main() {
    log_info "Starting Vhost Initialization..."
    
    detect_os
    install_deps
    setup_project
    launch_vhost
    
    echo ""
    log_step "Done! Services should be up."
    echo ""
    echo -e "🔌 Connect to PostgreSQL via TLS Tunnel:"
    echo -e "   ${GREEN}psql \"host=localhost port=5433 user=postgres dbname=postgres\"${NC}"
    echo ""
    echo "Note: Default password is set in docker-compose.yml (usually empty/trusted for localhost or 'postgres')"
    echo ""
}

main "$@"
