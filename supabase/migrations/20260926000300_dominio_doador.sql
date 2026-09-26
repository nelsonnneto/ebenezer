-- ============================================================
-- EbenézerConecta · 0003 · Domínio do doador
-- Titular: o doador. Base legal: execução de contrato (LGPD 7º V),
-- consentimento para comunicação (7º I). Retenção: 5 anos após a
-- última doação (recibo é documento fiscal do Instituto).
-- ============================================================

create table public.doador (
  id                          uuid primary key references auth.users(id) on delete cascade,
  nome_exibicao               text not null,
  email                       text not null,
  papel                       public.papel_usuario not null default 'doador',
  consent_comunicacao         boolean not null default false,
  consent_comunicacao_em      timestamptz,
  consent_compartilhar_nome   boolean not null default false,
  criado_em                   timestamptz not null default now(),
  anonimizado_em              timestamptz,             -- exclusão lógica: dados pessoais apagados, doações mantidas
  constraint doador_email_unico unique (email)
);
comment on table public.doador is 'Perfil do usuário autenticado. 1:1 com auth.users. Coordenação é o mesmo tipo com papel = coordenacao.';

create table public.embaixador (
  id           uuid primary key default gen_random_uuid(),
  doador_id    uuid not null unique references public.doador(id) on delete cascade,
  slug         text not null unique,                   -- 'eduardo-m' → ebenezerconecta.org.br/r/eduardo-m
  ativo        boolean not null default true,
  ativo_desde  timestamptz not null default now(),
  ativado_por  uuid,
  constraint embaixador_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40)
);
comment on table public.embaixador is 'Doador habilitado pela coordenação a mobilizar a própria rede.';

alter table public.meta
  add constraint meta_embaixador_fk foreign key (embaixador_id) references public.embaixador(id) on delete cascade;

create table public.origem (
  id                 uuid primary key default gen_random_uuid(),
  embaixador_id      uuid references public.embaixador(id) on delete set null,
  canal              public.canal_origem not null default 'direto',
  primeiro_acesso_em timestamptz not null default now(),
  doador_id          uuid references public.doador(id) on delete set null,   -- vinculado no primeiro login
  vinculada_em       timestamptz
);
comment on table public.origem is 'Rastreio de origem: criada anônima no primeiro acesso pelo link, vinculada ao doador no primeiro login. Base legal: legítimo interesse (7º IX).';
create index origem_embaixador_idx on public.origem (embaixador_id);
create index origem_doador_idx on public.origem (doador_id);
