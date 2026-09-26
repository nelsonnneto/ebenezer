-- ============================================================
-- EbenézerConecta · 0004 · Domínio da contribuição
-- Dado de contribuição nunca cai em cascata: é documento fiscal.
-- Valores individuais só são lidos pelo próprio doador e pela coordenação.
-- ============================================================

create table public.recorrencia (
  id               uuid primary key default gen_random_uuid(),
  doador_id        uuid not null references public.doador(id) on delete restrict,
  valor_centavos   integer not null,
  frequencia       public.frequencia_recorrencia not null default 'mensal',
  status           public.status_recorrencia not null default 'ativa',
  meio             public.meio_pagamento not null default 'simulado',
  meio_ref         text,                                -- 'cartão final 4417' (nunca o número)
  iniciada_em      timestamptz not null default now(),
  proxima_cobranca date,
  encerrada_em     timestamptz,
  constraint recorrencia_valor_na_escala check (valor_centavos between 2500 and 50000)
);
comment on table public.recorrencia is 'Compromisso recorrente. Uma ativa por doador. Faixa R$ 25–500 = escala do seletor do Figma.';
create unique index recorrencia_uma_ativa_por_doador
  on public.recorrencia (doador_id) where status = 'ativa';
create index recorrencia_cobranca_idx on public.recorrencia (proxima_cobranca) where status = 'ativa';

create table public.recorrencia_evento (
  id               uuid primary key default gen_random_uuid(),
  recorrencia_id   uuid not null references public.recorrencia(id) on delete cascade,
  tipo             public.tipo_evento_recorrencia not null,
  valor_anterior   integer,
  valor_novo       integer,
  freq_anterior    public.frequencia_recorrencia,
  freq_nova        public.frequencia_recorrencia,
  em               timestamptz not null default now()
  -- sem campo "justificativa": alterar, pausar e retomar não exigem explicação (§7)
);
create index recorrencia_evento_idx on public.recorrencia_evento (recorrencia_id, em);

create table public.doacao (
  id              uuid primary key default gen_random_uuid(),
  doador_id       uuid not null references public.doador(id) on delete restrict,
  recorrencia_id  uuid references public.recorrencia(id) on delete set null,
  origem_id       uuid references public.origem(id) on delete set null,
  tipo            public.tipo_doacao not null,
  meio            public.meio_pagamento not null default 'simulado',
  valor_centavos  integer not null,
  status          public.status_doacao not null default 'registrada',
  realizada_em    timestamptz not null default now(),
  confirmada_em   timestamptz,
  recibo_numero   text unique,
  constraint doacao_valor_positivo check (valor_centavos > 0),
  constraint doacao_confirmada_tem_data check (status <> 'confirmada' or confirmada_em is not null)
);
comment on table public.doacao is 'Cada aporte, único ou gerado por recorrência. Nunca excluído; estorno é status.';
create index doacao_doador_idx on public.doacao (doador_id, realizada_em desc);
create index doacao_periodo_idx on public.doacao (realizada_em) where status = 'confirmada';
create index doacao_origem_idx on public.doacao (origem_id) where origem_id is not null;
