#!/usr/bin/env bash
set -e

echo "== XControl Init =="

# 必须的环境变量
: "${DB_HOST:?}"
: "${DB_PORT:?}"
: "${DB_NAME:?}"
: "${DB_USER:?}"
: "${DB_PASS:?}"
: "${SCHEMA_DIR:?}"

ADMIN_USER="${ADMIN_USER:-postgres}"
ADMIN_PASS="${ADMIN_PASS:-postgres}"

APP_DSN="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
ADMIN_DSN="postgres://${ADMIN_USER}:${ADMIN_PASS}@${DB_HOST}:${DB_PORT}/postgres"

# 基础函数
admin_sql() { PGPASSWORD="$ADMIN_PASS" psql "$ADMIN_DSN" -Atc "$1"; }
app_sql()   { PGPASSWORD="$DB_PASS"   psql "$APP_DSN"   -Atc "$1"; }

echo "-- 检查用户 $DB_USER"
if admin_sql "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  echo "✓ 用户已存在"
else
  admin_sql "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}'"
  echo "✓ 用户已创建"
fi

echo "-- 检查数据库 $DB_NAME"
if admin_sql "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "✓ 数据库已存在"
else
  admin_sql "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"
  echo "✓ 数据库已创建"
fi

echo "-- 修复 public schema 权限"
app_sql "ALTER SCHEMA public OWNER TO ${DB_USER}" || true

echo "-- 执行所有 schema.sql"

for f in $(find "$SCHEMA_DIR" -name schema.sql | sort); do
  echo ">>> 应用 $f"
  PGPASSWORD="$DB_PASS" psql "$APP_DSN" -f "$f"
done

echo "✓ 所有 schema.sql 执行完毕"

# 创建超级管理员（可选）
if [ -n "${SUPERADMIN_USERNAME:-}" ] && [ -n "${SUPERADMIN_PASSWORD:-}" ]; then
  echo "-- 检查超级管理员 ${SUPERADMIN_USERNAME}"

  EXISTS=$(app_sql \
    "SELECT 1 FROM accounts WHERE username='${SUPERADMIN_USERNAME}' LIMIT 1;"
  )

  if [ "$EXISTS" = "1" ]; then
    echo "✓ 超管已存在"
  else
    echo "-- 创建超级管理员 ${SUPERADMIN_USERNAME}"
    createadmin \
      --driver postgres \
      --dsn "$APP_DSN" \
      --username "$SUPERADMIN_USERNAME" \
      --password "$SUPERADMIN_PASSWORD" \
      --email "${SUPERADMIN_EMAIL:-admin@localhost}"
    echo "✓ 超管创建完成"
  fi
fi

echo "== XControl Init 完成 =="
