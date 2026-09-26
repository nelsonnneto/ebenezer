#!/usr/bin/env bash
# Recria o banco local de testes do zero: shim de auth → migrations → seed → testes pgTAP.
# Uso: scripts/db-local.sh [host] [port]   (padrão localhost 5433)
set -euo pipefail
HOST="${1:-localhost}"; PORT="${2:-5433}"; DB="ebenezer_test"
PSQL="psql -v ON_ERROR_STOP=1 -h $HOST -p $PORT -U postgres -q"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql -h "$HOST" -p "$PORT" -U postgres -q -c "drop database if exists $DB" -c "create database $DB"
$PSQL -d $DB -f "$ROOT/supabase/tests/_shim_auth_local.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$f")"; $PSQL -d $DB -f "$f"
done
if [[ -f "$ROOT/supabase/seed.sql" ]]; then echo "→ seed.sql"; $PSQL -d $DB -f "$ROOT/supabase/seed.sql"; fi
if compgen -G "$ROOT/supabase/tests/[0-9]*.sql" > /dev/null; then
  $PSQL -d $DB -c "create extension if not exists pgtap"
  for t in "$ROOT"/supabase/tests/[0-9]*.sql; do echo "→ teste $(basename "$t")"; psql -h "$HOST" -p "$PORT" -U postgres -d $DB -f "$t"; done
fi
echo "✔ banco $DB pronto"
