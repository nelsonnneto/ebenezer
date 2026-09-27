-- Emula o mínimo do Supabase para rodar migrations, seed e testes num Postgres puro.
-- NÃO é aplicado no Supabase (lá auth.users, auth.identities, auth.uid() e os roles já existem).
create extension if not exists pgcrypto;
create schema if not exists auth;
create table if not exists auth.users (
  instance_id uuid, id uuid primary key default gen_random_uuid(), aud text, role text,
  email text unique, encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  provider_id text, provider text, identity_data jsonb, last_sign_in_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
-- Mesma definição do Supabase: lê o claim avulso (legado) ou o JSON completo (PostgREST ≥ 10).
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid $$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    'anon'
  ) $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
