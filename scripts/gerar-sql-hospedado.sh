#!/usr/bin/env bash
# Gera um único script para o SQL Editor do Supabase hospedado: migrações → seed → epílogo.
# Uso: scripts/gerar-sql-hospedado.sh [saida]   (padrão dist/ebenezer-supabase-hospedado.sql)
# Rode uma vez num projeto vazio. O script é transacional: se algo falhar, nada fica aplicado.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist/ebenezer-supabase-hospedado.sql}"
mkdir -p "$(dirname "$OUT")"
{
  echo "-- EbenézerConecta · script único para o Supabase hospedado"
  echo "-- Gerado em $(date -u +%Y-%m-%dT%H:%MZ) a partir do commit $(git -C "$ROOT" rev-parse --short HEAD)"
  echo "-- Cole inteiro no SQL Editor e execute (Run). Dados 100% sintéticos; senha dos usuários de demonstração: Ebenezer2026!"
  echo
  echo "begin;"
  echo "do \$\$ begin if to_regclass('public.doador') is not null then"
  echo "  raise exception 'O banco já tem o esquema do EbenézerConecta. Este script é para um projeto vazio.'; end if; end \$\$;"
  echo "set local search_path = public, extensions;"
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo; echo "-- ================= $(basename "$f") ================="; cat "$f"
  done
  echo; echo "-- ================= seed.sql ================="; cat "$ROOT/supabase/seed.sql"
  echo; cat "$ROOT/supabase/hospedado/epilogo.sql"
  echo; echo "commit;"
} > "$OUT"
echo "✔ $OUT ($(wc -c < "$OUT") bytes)"
