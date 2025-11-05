#!/bin/bash

# Token Auth 自动更新脚本
# 用法: ./update_token_auth.sh [options]
# 选项:
#   --generate-new    生成新的密钥对
#   --rotate          轮换现有密钥
#   --validate        验证配置一致性
#   --dry-run         预览模式（不实际更新）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置路径
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_CONFIG="$ROOT_DIR/dashboard-fresh/config/runtime-service-config.base.yaml"
ACCOUNT_CONFIG="$ROOT_DIR/account/config/account.yaml"
RAG_CONFIG="$ROOT_DIR/rag-server/config/server.yaml"
MANUAL_FILE="$ROOT_DIR/TOKEN_AUTH_MANUAL.md"

# 生成随机密钥
generate_random_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

# 生成 JWT 密钥
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d '\n'
}

# 备份文件
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "已备份文件: $file"
    fi
}

# 更新配置文件
update_config() {
    local file="$1"
    local public_token="$2"
    local refresh_secret="$3"
    local access_secret="$4"
    local dry_run="$5"

    log_info "更新配置文件: $file"

    if [ "$dry_run" = "true" ]; then
        log_info "[DRY RUN] 将要更新: $file"
        log_info "  Public Token: $public_token"
        log_info "  Refresh Secret: $refresh_secret"
        log_info "  Access Secret: $access_secret"
        return
    fi

    # 备份原始文件
    backup_file "$file"

    # 使用 sed 更新配置
    # 注意: 这里假设 YAML 配置格式为特定的样式
    if [[ "$file" == *"dashboard-fresh"* ]]; then
        # dashboard-fresh 配置格式 (前端应用，只需 publicToken)
        sed -i '' -e "s/publicToken:.*/publicToken: \"$public_token\"/" "$file"
    else
        # account 和 rag-server 配置格式 (后端服务，需要所有字段)
        sed -i '' -e "s/publicToken:.*/publicToken: \"$public_token\"/" "$file"
        sed -i '' -e "s/refreshSecret:.*/refreshSecret: \"$refresh_secret\"/" "$file"
        sed -i '' -e "s/accessSecret:.*/accessSecret: \"$access_secret\"/" "$file"
    fi

    log_success "已更新: $file"
}

# 验证配置一致性
validate_configs() {
    log_info "验证配置文件一致性..."

    local errors=0

    # 检查文件是否存在
    for file in "$DASHBOARD_CONFIG" "$ACCOUNT_CONFIG" "$RAG_CONFIG"; do
        if [ ! -f "$file" ]; then
            log_error "配置文件不存在: $file"
            errors=$((errors + 1))
        fi
    done

    # 提取并比较 Public Token
    local dashboard_public=$(grep "publicToken:" "$DASHBOARD_CONFIG" | awk '{print $2}' | tr -d '"')
    local account_public=$(grep "publicToken:" "$ACCOUNT_CONFIG" | awk '{print $2}' | tr -d '"')
    local rag_public=$(grep "publicToken:" "$RAG_CONFIG" | awk '{print $2}' | tr -d '"')

    if [ "$dashboard_public" != "$account_public" ] || [ "$dashboard_public" != "$rag_public" ]; then
        log_error "Public Token 不一致!"
        log_error "  Dashboard: $dashboard_public"
        log_error "  Account: $account_public"
        log_error "  RAG: $rag_public"
        errors=$((errors + 1))
    else
        log_success "Public Token 一致"
    fi

    # 提取并比较 Refresh Secret (dashboard-fresh 可能没有此字段)
    local account_refresh=$(grep "refreshSecret:" "$ACCOUNT_CONFIG" | awk '{print $2}' | tr -d '"')
    local rag_refresh=$(grep "refreshSecret:" "$RAG_CONFIG" | awk '{print $2}' | tr -d '"')

    if [ "$account_refresh" != "$rag_refresh" ]; then
        log_error "Refresh Secret 不一致!"
        log_error "  Account: $account_refresh"
        log_error "  RAG: $rag_refresh"
        errors=$((errors + 1))
    else
        log_success "Refresh Secret 一致"
    fi

    # 提取并比较 Access Secret (仅检查 account 和 rag-server)
    local account_access=$(grep "accessSecret:" "$ACCOUNT_CONFIG" | awk '{print $2}' | tr -d '"')
    local rag_access=$(grep "accessSecret:" "$RAG_CONFIG" | awk '{print $2}' | tr -d '"')

    if [ "$account_access" != "$rag_access" ]; then
        log_error "Access Secret 不一致!"
        log_error "  Account: $account_access"
        log_error "  RAG: $rag_access"
        errors=$((errors + 1))
    else
        log_success "Access Secret 一致"
    fi

    # 检查 auth.enable 字段
    local account_auth_enabled=$(grep -A1 "^auth:" "$ACCOUNT_CONFIG" | grep "enable:" | awk '{print $2}')
    local rag_auth_enabled=$(grep -A1 "^auth:" "$RAG_CONFIG" | grep "enable:" | awk '{print $2}')

    if [ "$account_auth_enabled" != "$rag_auth_enabled" ]; then
        log_error "Auth Enable 状态不一致!"
        log_error "  Account: $account_auth_enabled"
        log_error "  RAG: $rag_auth_enabled"
        errors=$((errors + 1))
    else
        log_success "Auth Enable 状态一致"
    fi

    if [ $errors -eq 0 ]; then
        log_success "所有配置验证通过"
        return 0
    else
        log_error "发现 $errors 个错误"
        return 1
    fi
}

# 生成新的密钥对
generate_new_tokens() {
    log_info "生成新的密钥对..."

    local public_token="xcontrol-public-$(date +%Y%m%d)-$(openssl rand -hex 4)"
    local refresh_secret="xcontrol-refresh-$(date +%Y%m%d)-$(openssl rand -hex 16)"
    local access_secret="xcontrol-access-$(date +%Y%m%d)-$(openssl rand -hex 32)"

    echo ""
    log_info "=== 新的密钥对 ==="
    echo "Public Token: $public_token"
    echo "Refresh Secret: $refresh_secret"
    echo "Access Secret: $access_secret"
    echo ""

    read -p "确认生成新密钥? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "操作已取消"
        exit 0
    fi

    echo "$public_token" > /tmp/new_public_token.txt
    echo "$refresh_secret" > /tmp/new_refresh_secret.txt
    echo "$access_secret" > /tmp/new_access_secret.txt

    log_success "新密钥已生成并保存到临时文件"
    log_info "临时文件位置:"
    log_info "  /tmp/new_public_token.txt"
    log_info "  /tmp/new_refresh_secret.txt"
    log_info "  /tmp/new_access_secret.txt"
}

# 应用新密钥
apply_new_tokens() {
    local dry_run="$1"

    if [ ! -f "/tmp/new_public_token.txt" ] || [ ! -f "/tmp/new_refresh_secret.txt" ] || [ ! -f "/tmp/new_access_secret.txt" ]; then
        log_error "找不到新密钥文件，请先运行 --generate-new"
        exit 1
    fi

    local public_token=$(cat /tmp/new_public_token.txt)
    local refresh_secret=$(cat /tmp/new_refresh_secret.txt)
    local access_secret=$(cat /tmp/new_access_secret.txt)

    log_info "应用新的密钥到配置文件..."

    update_config "$DASHBOARD_CONFIG" "$public_token" "$refresh_secret" "$access_secret" "$dry_run"
    update_config "$ACCOUNT_CONFIG" "$public_token" "$refresh_secret" "$access_secret" "$dry_run"
    update_config "$RAG_CONFIG" "$public_token" "$refresh_secret" "$access_secret" "$dry_run"

    if [ "$dry_run" = "true" ]; then
        log_info "[DRY RUN] 完成预览模式"
        return
    fi

    # 清理临时文件
    rm -f /tmp/new_public_token.txt /tmp/new_refresh_secret.txt /tmp/new_access_secret.txt

    log_success "所有配置文件已更新"

    # 验证更新
    validate_configs
}

# 轮换密钥
rotate_tokens() {
    local dry_run="$1"

    log_info "开始密钥轮换..."

    # 生成新密钥
    generate_new_tokens

    # 应用新密钥
    apply_new_tokens "$dry_run"
}

# 更新维护手册
update_manual() {
    local file="$MANUAL_FILE"
    if [ ! -f "$file" ]; then
        log_warn "维护手册不存在: $file"
        return
    fi

    local date_str=$(date +%Y-%m-%d)
    local version=$(grep "文档版本:" "$file" | awk '{print $3}' | tr -d 'v')

    if [ -n "$version" ]; then
        local new_version=$((version + 1))
        sed -i '' -e "s/文档版本: v$version/文档版本: v$new_version/" "$file"
        sed -i '' -e "s/最后更新:.*/最后更新: $date_str/" "$file"
        log_success "维护手册已更新 (v$version -> v$new_version)"
    else
        log_warn "无法解析文档版本"
    fi
}

# 清理备份文件
cleanup_backups() {
    log_info "清理备份文件..."

    find "$ROOT_DIR" -name "*.backup.*" -type f -mtime +7 -delete
    log_success "已清理 7 天前的备份文件"
}

# 显示帮助信息
show_help() {
    cat << EOF
Token Auth 自动更新脚本

用法:
    $0 [选项]

选项:
    --generate-new    生成新的密钥对
    --rotate          轮换现有密钥（生成新密钥并应用）
    --validate        验证配置一致性
    --update-manual   更新维护手册版本号
    --cleanup         清理旧的备份文件
    --dry-run         预览模式（不实际更新文件）
    -h, --help        显示此帮助信息

示例:
    # 生成新密钥
    $0 --generate-new

    # 轮换密钥
    $0 --rotate

    # 验证配置
    $0 --validate

    # 预览模式（不实际更新）
    $0 --rotate --dry-run

    # 清理备份
    $0 --cleanup

EOF
}

# 主逻辑
main() {
    local action=""
    local dry_run="false"

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --generate-new)
                action="generate"
                shift
                ;;
            --rotate)
                action="rotate"
                shift
                ;;
            --validate)
                action="validate"
                shift
                ;;
            --update-manual)
                action="update-manual"
                shift
                ;;
            --cleanup)
                action="cleanup"
                shift
                ;;
            --dry-run)
                dry_run="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [ -z "$action" ]; then
        log_error "请指定操作"
        show_help
        exit 1
    fi

    # 检查依赖
    if ! command -v openssl &> /dev/null; then
        log_error "需要安装 OpenSSL"
        exit 1
    fi

    # 执行操作
    case $action in
        generate)
            generate_new_tokens
            ;;
        rotate)
            rotate_tokens "$dry_run"
            ;;
        validate)
            validate_configs
            ;;
        update-manual)
            update_manual
            ;;
        cleanup)
            cleanup_backups
            ;;
    esac
}

# 运行主函数
main "$@"
