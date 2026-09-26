-- ============================================================
-- EbenézerConecta · 0005 · Domínio do reconhecimento
-- Escrito apenas por funções do banco. Marco conquistado nunca é removido.
-- ============================================================

create table public.conquista (
  id           uuid primary key default gen_random_uuid(),
  doador_id    uuid not null references public.doador(id) on delete restrict,
  marco_id     uuid not null references public.marco(id) on delete restrict,
  alcancada_em timestamptz not null default now(),
  constraint conquista_unica unique (doador_id, marco_id)
);

create sequence public.certificado_seq start 148;   -- o protótipo exibe EC-2026-000148

create table public.certificado (
  id                uuid primary key default gen_random_uuid(),
  conquista_id      uuid not null unique references public.conquista(id) on delete restrict,
  numero_registro   text not null unique,               -- 'EC-2026-000148'
  hash_verificacao  text not null,                      -- sha256(doador_id || marco || data)
  emitido_em        timestamptz not null default now()
);
comment on table public.certificado is 'Registro permanente e imutável. Verificação pública devolve só número, marco e período.';

create table public.compartilhamento (
  id         uuid primary key default gen_random_uuid(),
  doador_id  uuid not null references public.doador(id) on delete cascade,
  conteudo   public.conteudo_compartilhamento not null,
  rede       public.canal_origem not null,
  em         timestamptz not null default now()
);
create index compartilhamento_doador_idx on public.compartilhamento (doador_id, em desc);
