#!/usr/bin/env bash
# Gera os scripts para o SQL Editor do Supabase hospedado:
#   dist/ebenezer-supabase-hospedado.sql  → instalação (migrações → seed → epílogo)
#   dist/ebenezer-supabase-limpar.sql     → limpeza, para repetir a instalação após uma execução interrompida
# O SQL Editor pode executar cada comando numa sessão própria: o script não depende de estado de sessão
# (sem tabelas temporárias, sem "set local", funções de extensão qualificadas) e não é transacional.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist/ebenezer-supabase-hospedado.sql}"
LIMPAR="$(dirname "$OUT")/ebenezer-supabase-limpar.sql"
mkdir -p "$(dirname "$OUT")"
COMMIT="$(git -C "$ROOT" rev-parse --short HEAD)"
{
  echo "-- EbenézerConecta · script único para o Supabase hospedado"
  echo "-- Gerado em $(date -u +%Y-%m-%dT%H:%MZ) a partir do commit $COMMIT"
  echo "-- Cole inteiro no SQL Editor (New query), sem nada selecionado, e execute (Run). Dados 100% sintéticos;"
  echo "-- senha dos usuários de demonstração: Ebenezer2026!"
  echo "-- Se parar no meio: rode ebenezer-supabase-limpar.sql e execute este de novo."
  echo
  echo "do \$\$ begin if to_regclass('public.doador') is not null then"
  echo "  raise exception 'O projeto já tem objetos do EbenézerConecta (talvez de uma execução interrompida). Rode antes ebenezer-supabase-limpar.sql.'; end if; end \$\$;"
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo; echo "-- ================= $(basename "$f") ================="; cat "$f"
  done
  echo; echo "-- ================= seed.sql ================="
  # no hospedado o pgcrypto fica no schema extensions
  sed -e "s/\bcrypt(/extensions.crypt(/g" -e "s/\bgen_salt(/extensions.gen_salt(/g" "$ROOT/supabase/seed.sql"
  echo; cat "$ROOT/supabase/hospedado/epilogo.sql"
} > "$OUT"
{ echo "-- Gerado a partir do commit $COMMIT"; cat "$ROOT/supabase/hospedado/limpar.sql"; } > "$LIMPAR"
echo "✔ $OUT ($(wc -c < "$OUT") bytes)"
echo "✔ $LIMPAR"
