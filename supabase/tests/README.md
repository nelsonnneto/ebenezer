# Testes do banco

- `_shim_auth_local.sql` — emula `auth.users`, `auth.identities`, `auth.uid()`, `auth.role()` e os roles `anon` / `authenticated` / `service_role` para rodar tudo num Postgres puro. **Não é aplicado no Supabase**, onde isso já existe.
- `0001_esquema.sql` — tabelas, RLS habilitada, catálogos, constraints.
- `0002_regras.sql` — continuidade (pausa congela, cancelamento zera), marcos, certificado imutável e idempotente, verificação pública, job de cobrança.
- `0003_rls_e_rpcs.sql` — o que `anon` e um doador conseguem ler; RPCs do fluxo principal (US-01, US-02) executadas como o doador.

Rodar tudo do zero: `scripts/db-local.sh` (Postgres local) ou `supabase test db` (CLI, com o projeto local ativo).
