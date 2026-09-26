-- ============================================================
-- EbenézerConecta · 0002 · Domínio institucional
-- Titular: o Instituto. Sem dado pessoal. Escrita: coordenação.
-- Nenhuma tabela deste domínio tem chave para pessoa atendida —
-- a granularidade mínima é programa × mês (bloco 6 do dossiê).
-- ============================================================

create table public.programa (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,                 -- 'lab_sonhos', 'reforco', 'primeira_infancia', 'vivencia'
  nome          text not null,
  faixa_etaria  text not null,                        -- texto livre: '7 a 11 anos' — nunca contagem
  cadencia      text not null,                        -- 'sábados', 'segunda a sexta'
  descricao     text,
  ordem         smallint not null default 0,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);
comment on table public.programa is 'Catálogo dos programas do Instituto. Sem dado pessoal.';

create table public.imagem (
  id               uuid primary key default gen_random_uuid(),
  url_storage      text not null,                     -- caminho no bucket "midia"
  descricao_alt    text not null,                     -- texto alternativo obrigatório
  ilustrativa      boolean not null default true,     -- true = não retrata criança atendida
  autorizacao_ref  text,                              -- referência do termo de uso, quando houver foto real
  criado_em        timestamptz not null default now(),
  constraint imagem_ilustrativa_sem_autorizacao
    check (ilustrativa = true or autorizacao_ref is not null)
);
comment on table public.imagem is 'Banco de imagens. Enquanto não houver autorização registrada, toda imagem é ilustrativa por construção.';

create table public.indicador (
  id             uuid primary key default gen_random_uuid(),
  programa_id    uuid not null references public.programa(id) on delete restrict,
  periodo        date not null,                       -- sempre o 1º dia do mês
  tipo           public.tipo_indicador not null,
  valor          numeric(12,2) not null,
  publico        boolean not null default true,       -- visível na landing sem login
  atualizado_por uuid,                                -- auth.users.id da coordenação (sem FK para não travar seed)
  atualizado_em  timestamptz not null default now(),
  constraint indicador_valor_nao_negativo check (valor >= 0),
  constraint indicador_periodo_mes_cheio  check (periodo = date_trunc('month', periodo)::date),
  constraint indicador_unico_por_mes      unique (programa_id, periodo, tipo)
);
comment on table public.indicador is 'Indicador agregado por programa e mês. Única granularidade permitida (bloco 6).';
create index indicador_periodo_idx on public.indicador (periodo desc);

create table public.publicacao (
  id             uuid primary key default gen_random_uuid(),
  programa_id    uuid not null references public.programa(id) on delete restrict,
  imagem_id      uuid references public.imagem(id) on delete set null,
  titulo         text not null,
  texto          text not null,
  cadencia       public.cadencia_publicacao not null,
  metrica_rotulo text,                                -- '+36 horas de atividade'
  metrica_valor  numeric(12,2),
  status         public.status_publicacao not null default 'rascunho',
  publico        boolean not null default false,
  publicada_em   timestamptz,
  criado_por     uuid,
  criado_em      timestamptz not null default now(),
  constraint publicacao_publicada_tem_data check (status <> 'publicada' or publicada_em is not null)
);
comment on table public.publicacao is 'Post do feed. É o Card de Publicação do Figma, campo a campo.';
create index publicacao_feed_idx on public.publicacao (status, publicada_em desc);

create table public.material_campanha (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  descricao    text,
  tipo         public.tipo_material not null,
  imagem_id    uuid references public.imagem(id) on delete set null,
  url_storage  text,                                  -- arquivo para download (card, assinatura)
  texto_pronto text,                                  -- texto com {{link}} para substituição
  aprovado_por uuid,
  versao       smallint not null default 1,
  ativo        boolean not null default true,
  ordem        smallint not null default 0,
  criado_em    timestamptz not null default now(),
  constraint material_tem_conteudo check (url_storage is not null or texto_pronto is not null)
);

create table public.meta (
  id             uuid primary key default gen_random_uuid(),
  tipo           public.tipo_meta not null,
  programa_id    uuid references public.programa(id) on delete restrict,   -- null = meta global
  embaixador_id  uuid,                                -- preenchido na migration 0003 (FK adiada)
  rotulo         text not null,
  alvo           numeric(14,2) not null,              -- centavos (anual) ou nº de doadores (rede)
  periodo_inicio date not null,
  periodo_fim    date not null,
  criado_em      timestamptz not null default now(),
  constraint meta_periodo_valido check (periodo_fim >= periodo_inicio),
  constraint meta_alvo_positivo  check (alvo > 0)
);

create table public.marco (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,               -- 'primeiro_passo', 'impacto_continuo', ...
  trilha           public.trilha_marco not null,
  nome             text not null,
  descricao        text not null,
  meses_requeridos smallint,                           -- trilha doador
  doadores_requeridos smallint,                        -- trilha embaixador
  ordem            smallint not null,
  constraint marco_ordem_unica_por_trilha unique (trilha, ordem)
);
comment on table public.marco is 'Catálogo de marcos. Medem continuidade (meses) ou mobilização (doadores) — nunca valor doado (§7).';
