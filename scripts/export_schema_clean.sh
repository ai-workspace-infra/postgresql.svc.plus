#!/usr/bin/env bash
set -euo pipefail

DB_URL="${1:-${DATABASE_URL:-}}"
OUT="${2:-${SCHEMA_OUTPUT:-/tmp/schema_supabase_clean.sql}}"

if [[ -z "$DB_URL" ]]; then
  echo "Usage: DATABASE_URL=postgresql://... $0 [database-url] [output-file]" >&2
  exit 2
fi

if [[ "$DB_URL" != postgres://* && "$DB_URL" != postgresql://* ]]; then
  echo "❌ The database URL must use postgres:// or postgresql://" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT")"
TMP_DUMP="$(mktemp)"
trap 'rm -f "$TMP_DUMP"' EXIT

echo ">>> Exporting clean schema (optional extensions removed)"
pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  "$DB_URL" > "$TMP_DUMP"

# pg_dump emits extension declarations and dependent objects as complete SQL
# statements.  Filter statements, rather than individual lines, so a
# multi-line COMMENT/ALTER statement cannot leave a broken dump behind.
awk '
  function flush(    lower) {
    if (statement == "") return
    lower = tolower(statement)
    if (lower ~ /create[[:space:]]+extension[^;]*(pg_jieba|pgmq|pglogical)/ ||
        lower ~ /comment[[:space:]]+on[[:space:]]+extension[^;]*(pg_jieba|pgmq|pglogical)/ ||
        lower ~ /alter[[:space:]]+extension[^;]*(pg_jieba|pgmq|pglogical)/ ||
        lower ~ /(^|[^[:alnum:]_])(jiebacfg|pgmq|pglogical)\./ ||
        lower ~ /create[[:space:]]+(schema|schema[[:space:]]+if[[:space:]]+not[[:space:]]+exists)[[:space:]]+pglogical/) {
      statement = ""
      return
    }
    printf "%s", statement
    statement = ""
  }
  /^\\/ && statement == "" { print; next }
  { statement = statement $0 "\n" }
  /;[[:space:]]*$/ { flush() }
  END { flush() }
' "$TMP_DUMP" > "$OUT"

if rg -n -i 'pg_jieba|pgmq|pglogical|jiebacfg' "$OUT" >/dev/null; then
  echo "❌ Optional extension references remain in $OUT" >&2
  rg -n -i 'pg_jieba|pgmq|pglogical|jiebacfg' "$OUT" >&2
  exit 1
fi

echo "✅ Schema exported to $OUT"
