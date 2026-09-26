-- ============================================================
-- EbenézerConecta · 0006 · Funções, RPCs e triggers
-- Toda regra de negócio vive aqui. O front só chama RPCs e lê views.
-- ============================================================

-- ------------------------------------------------------------
-- Papel e identidade
-- ------------------------------------------------------------
create or replace function public.fn_e_coordenacao()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.doador where id = auth.uid() and papel = 'coordenacao');
$$;

-- Contexto administrativo: seed, migrations, jobs (sem JWT) — nunca um usuário do app.
create or replace function public.fn_contexto_admin()
returns boolean language sql stable as $$
  select auth.uid() is null and current_user in ('postgres', 'supabase_admin', 'service_role');
$$;

-- Cria o perfil do doador quando o usuário nasce no Auth.
create or replace function public.fn_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.doador (id, nome_exibicao, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario after insert on auth.users
  for each row execute function public.fn_novo_usuario();

-- ------------------------------------------------------------
-- Continuidade: meses consecutivos de contribuição
-- Um mês conta se tem doação confirmada. Uma pausa registrada cobre
-- o intervalo sem quebrar a sequência, mas não soma. Cancelamento ou
-- simples ausência quebram a sequência a partir do mês seguinte.
-- ------------------------------------------------------------
create or replace function public.fn_meses_consecutivos(p_doador uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_mes date;
  v_ultimo date;
  v_atual date := date_trunc('month', now())::date;
  v_count integer := 0;
  v_doou boolean;
  v_pausado boolean;
begin
  select max(date_trunc('month', realizada_em))::date into v_ultimo
  from public.doacao where doador_id = p_doador and status = 'confirmada';
  if v_ultimo is null then return 0; end if;

  -- sequência viva: último mês coberto é o atual ou o anterior
  -- (se estiver pausado agora, o mês corrente conta como coberto)
  if v_ultimo < v_atual - interval '1 month' then
    if not exists (
      select 1 from public.recorrencia r
      where r.doador_id = p_doador and r.status = 'pausada'
    ) then return 0; end if;
  end if;

  v_mes := greatest(v_ultimo, v_atual);
  loop
    select exists (
      select 1 from public.doacao
      where doador_id = p_doador and status = 'confirmada'
        and date_trunc('month', realizada_em)::date = v_mes
    ) into v_doou;

    if v_doou then
      v_count := v_count + 1;
    else
      -- mês coberto por pausa? (evento 'pausada' antes do fim do mês e sem 'retomada'/'cancelada' antes do início)
      select exists (
        select 1
        from public.recorrencia r
        join public.recorrencia_evento p on p.recorrencia_id = r.id and p.tipo = 'pausada'
        where r.doador_id = p_doador
          and p.em < (v_mes + interval '1 month')
          and not exists (
            select 1 from public.recorrencia_evento q
            where q.recorrencia_id = r.id and q.tipo in ('retomada', 'cancelada')
              and q.em > p.em and q.em < v_mes
          )
      ) into v_pausado;
      if not v_pausado then exit; end if;
    end if;

    v_mes := (v_mes - interval '1 month')::date;
    exit when v_mes < '2000-01-01';
  end loop;
  return v_count;
end $$;

-- ------------------------------------------------------------
-- Marcos do doador
-- ------------------------------------------------------------
create or replace function public.fn_avaliar_marcos(p_doador uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_meses integer;
  v_ciclo_completo boolean;
begin
  if not exists (select 1 from public.doacao where doador_id = p_doador and status = 'confirmada') then return; end if;

  -- Primeiro Passo: primeira doação confirmada
  insert into public.conquista (doador_id, marco_id, alcancada_em)
  select p_doador, m.id, (select min(confirmada_em) from public.doacao where doador_id = p_doador and status = 'confirmada')
  from public.marco m where m.codigo = 'primeiro_passo'
  on conflict do nothing;

  -- Marcos por continuidade: a data da conquista é a da doação que completou a sequência
  v_meses := public.fn_meses_consecutivos(p_doador);
  insert into public.conquista (doador_id, marco_id, alcancada_em)
  select p_doador, m.id,
         coalesce((
           select min(o.confirmada_em) from public.doacao o
           where o.doador_id = p_doador and o.status = 'confirmada'
             and date_trunc('month', o.realizada_em)::date =
                 (date_trunc('month', (select max(realizada_em) from public.doacao where doador_id = p_doador and status = 'confirmada'))
                  - ((v_meses - m.meses_requeridos) || ' months')::interval)::date
         ), now())
  from public.marco m
  where m.trilha = 'doador' and m.meses_requeridos is not null and m.meses_requeridos <= v_meses
    and m.codigo <> 'primeiro_passo'
  on conflict do nothing;

  -- Guardião da Educação: um ano-calendário inteiro (jan–dez) com doação em todos os meses
  select exists (
    select 1 from (
      select extract(year from realizada_em) as ano, count(distinct date_trunc('month', realizada_em)) as meses
      from public.doacao where doador_id = p_doador and status = 'confirmada'
      group by 1
    ) a where a.meses = 12
  ) into v_ciclo_completo;
  if v_ciclo_completo then
    insert into public.conquista (doador_id, marco_id)
    select p_doador, m.id from public.marco m where m.codigo = 'guardiao_educacao'
    on conflict do nothing;
  end if;
end $$;

-- ------------------------------------------------------------
-- Marcos do embaixador
-- ------------------------------------------------------------
create or replace function public.fn_avaliar_marcos_embaixador(p_embaixador uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doador uuid;
  v_mobilizados integer;
  v_meta_alvo numeric;
begin
  select doador_id into v_doador from public.embaixador where id = p_embaixador;
  if v_doador is null then return; end if;

  -- Voz da Causa: primeiro compartilhamento
  if exists (select 1 from public.compartilhamento where doador_id = v_doador) then
    insert into public.conquista (doador_id, marco_id)
    select v_doador, id from public.marco where codigo = 'voz_da_causa' on conflict do nothing;
  end if;

  -- Doadores mobilizados: pessoas distintas com origem deste embaixador e ao menos uma doação confirmada
  select count(distinct d.doador_id) into v_mobilizados
  from public.doacao d join public.origem o on o.id = d.origem_id
  where o.embaixador_id = p_embaixador and d.status = 'confirmada';

  insert into public.conquista (doador_id, marco_id)
  select v_doador, m.id from public.marco m
  where m.trilha = 'embaixador' and m.doadores_requeridos is not null and m.doadores_requeridos <= v_mobilizados
  on conflict do nothing;

  -- Multiplicador de Impacto: meta de rede atingida
  select min(alvo) into v_meta_alvo from public.meta where tipo = 'rede' and embaixador_id = p_embaixador;
  if v_meta_alvo is not null and v_mobilizados >= v_meta_alvo then
    insert into public.conquista (doador_id, marco_id)
    select v_doador, id from public.marco where codigo = 'multiplicador' on conflict do nothing;
  end if;
end $$;

-- Concessão manual pela coordenação (Embaixador Ebenézer, reconhecimento anual)
create or replace function public.fn_conceder_marco(p_doador uuid, p_codigo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.fn_e_coordenacao() or public.fn_contexto_admin()) then
    raise exception 'apenas a coordenação concede marcos manualmente' using errcode = '42501';
  end if;
  insert into public.conquista (doador_id, marco_id)
  select p_doador, id from public.marco where codigo = p_codigo on conflict do nothing;
end $$;

-- ------------------------------------------------------------
-- Triggers de avaliação
-- ------------------------------------------------------------
create or replace function public.trg_fn_doacao_confirmada()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_emb uuid;
begin
  if new.status = 'confirmada' and (tg_op = 'INSERT' or old.status is distinct from 'confirmada') then
    perform public.fn_avaliar_marcos(new.doador_id);
    if new.origem_id is not null then
      select embaixador_id into v_emb from public.origem where id = new.origem_id;
      if v_emb is not null then perform public.fn_avaliar_marcos_embaixador(v_emb); end if;
    end if;
  end if;
  return new;
end $$;

create trigger trg_doacao_confirmada after insert or update of status on public.doacao
  for each row execute function public.trg_fn_doacao_confirmada();

create or replace function public.trg_fn_compartilhamento()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_emb uuid;
begin
  select id into v_emb from public.embaixador where doador_id = new.doador_id;
  if v_emb is not null then perform public.fn_avaliar_marcos_embaixador(v_emb); end if;
  return new;
end $$;

create trigger trg_compartilhamento after insert on public.compartilhamento
  for each row execute function public.trg_fn_compartilhamento();

-- Certificado é imutável
create or replace function public.trg_fn_bloquear()
returns trigger language plpgsql as $$
begin
  raise exception 'registro imutável: %', tg_table_name using errcode = '42501';
end $$;
create trigger trg_certificado_imutavel before update or delete on public.certificado
  for each row execute function public.trg_fn_bloquear();
create trigger trg_conquista_imutavel before update or delete on public.conquista
  for each row execute function public.trg_fn_bloquear();

-- ------------------------------------------------------------
-- Certificado
-- ------------------------------------------------------------
create sequence if not exists public.recibo_seq start 1;

create or replace function public.fn_emitir_certificado(p_conquista uuid)
returns public.certificado language plpgsql security definer set search_path = public as $$
declare
  v_c public.conquista;
  v_cert public.certificado;
  v_ano text;
begin
  select * into v_c from public.conquista where id = p_conquista;
  if v_c.id is null then raise exception 'conquista inexistente' using errcode = 'P0002'; end if;
  if not (v_c.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()) then
    raise exception 'sem permissão para emitir este certificado' using errcode = '42501';
  end if;

  select * into v_cert from public.certificado where conquista_id = p_conquista;
  if v_cert.id is not null then return v_cert; end if;   -- idempotente

  v_ano := to_char(coalesce(v_c.alcancada_em, now()), 'YYYY');
  insert into public.certificado (conquista_id, numero_registro, hash_verificacao)
  values (
    p_conquista,
    'EC-' || v_ano || '-' || lpad(nextval('public.certificado_seq')::text, 6, '0'),
    encode(digest(v_c.doador_id::text || v_c.marco_id::text || v_c.alcancada_em::text, 'sha256'), 'hex')
  )
  returning * into v_cert;
  return v_cert;
end $$;

-- Verificação pública: nenhum dado pessoal
create or replace function public.fn_verificar_certificado(p_numero text)
returns table (numero_registro text, marco text, trilha public.trilha_marco, alcancada_em date, emitido_em date, valido boolean)
language sql stable security definer set search_path = public as $$
  select c.numero_registro, m.nome, m.trilha, q.alcancada_em::date, c.emitido_em::date, true
  from public.certificado c
  join public.conquista q on q.id = c.conquista_id
  join public.marco m on m.id = q.marco_id
  where c.numero_registro = upper(trim(p_numero));
$$;

-- ------------------------------------------------------------
-- Origem (rastreio do link do embaixador)
-- ------------------------------------------------------------
create or replace function public.fn_registrar_origem(p_slug text, p_canal public.canal_origem default 'direto')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_emb uuid; v_id uuid;
begin
  select id into v_emb from public.embaixador where slug = lower(p_slug) and ativo;
  insert into public.origem (embaixador_id, canal) values (v_emb, coalesce(p_canal, 'direto')) returning id into v_id;
  return v_id;
end $$;

create or replace function public.fn_vincular_origem(p_origem uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  -- só vincula se o doador ainda não tem origem e a origem ainda está solta
  if exists (select 1 from public.origem where doador_id = auth.uid()) then return; end if;
  update public.origem set doador_id = auth.uid(), vinculada_em = now()
  where id = p_origem and doador_id is null;
end $$;

create or replace function public.fn_origem_do_doador(p_doador uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.origem where doador_id = p_doador order by vinculada_em nulls last limit 1;
$$;

-- ------------------------------------------------------------
-- Contribuição: RPCs chamadas pelo front
-- ------------------------------------------------------------
create or replace function public.fn_proxima_data(p_base date, p_freq public.frequencia_recorrencia)
returns date language sql immutable as $$
  select case p_freq
    when 'semanal'   then p_base + 7
    when 'quinzenal' then p_base + 14
    else (p_base + interval '1 month')::date end;
$$;

create or replace function public.fn_confirmar_doacao(p_doador uuid, p_valor integer, p_tipo public.tipo_doacao,
                                                      p_meio public.meio_pagamento, p_recorrencia uuid, p_em timestamptz)
returns public.doacao language plpgsql security definer set search_path = public as $$
declare v_d public.doacao;
begin
  insert into public.doacao (doador_id, recorrencia_id, origem_id, tipo, meio, valor_centavos, status, realizada_em, confirmada_em, recibo_numero)
  values (p_doador, p_recorrencia, public.fn_origem_do_doador(p_doador), p_tipo, p_meio, p_valor, 'confirmada', p_em, p_em,
          'RC-' || to_char(p_em, 'YYYY') || '-' || lpad(nextval('public.recibo_seq')::text, 6, '0'))
  returning * into v_d;
  return v_d;
end $$;

create or replace function public.fn_doar_unica(p_valor integer, p_meio public.meio_pagamento default 'simulado')
returns public.doacao language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '42501'; end if;
  return public.fn_confirmar_doacao(auth.uid(), p_valor, 'unica', p_meio, null, now());
end $$;

create or replace function public.fn_iniciar_recorrencia(p_valor integer, p_freq public.frequencia_recorrencia default 'mensal',
                                                          p_meio public.meio_pagamento default 'simulado', p_meio_ref text default null)
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '42501'; end if;
  if exists (select 1 from public.recorrencia where doador_id = auth.uid() and status = 'ativa') then
    raise exception 'já existe uma recorrência ativa; altere-a em vez de criar outra' using errcode = '23505';
  end if;
  insert into public.recorrencia (doador_id, valor_centavos, frequencia, meio, meio_ref, proxima_cobranca)
  values (auth.uid(), p_valor, p_freq, p_meio, p_meio_ref, public.fn_proxima_data(current_date, p_freq))
  returning * into v_r;
  insert into public.recorrencia_evento (recorrencia_id, tipo, valor_novo, freq_nova) values (v_r.id, 'criada', p_valor, p_freq);
  perform public.fn_confirmar_doacao(auth.uid(), p_valor, 'recorrente', p_meio, v_r.id, now());   -- primeira cobrança hoje
  return v_r;
end $$;

create or replace function public.fn_recorrencia_ativa()
returns public.recorrencia language sql stable security definer set search_path = public as $$
  select * from public.recorrencia where doador_id = auth.uid() and status in ('ativa', 'pausada') order by iniciada_em desc limit 1;
$$;

create or replace function public.fn_alterar_recorrencia(p_valor integer, p_freq public.frequencia_recorrencia)
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  select * into v_r from public.recorrencia where doador_id = auth.uid() and status = 'ativa';
  if v_r.id is null then raise exception 'nenhuma recorrência ativa' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo, valor_anterior, valor_novo, freq_anterior, freq_nova)
  values (v_r.id, 'alterada', v_r.valor_centavos, p_valor, v_r.frequencia, p_freq);
  update public.recorrencia set valor_centavos = p_valor, frequencia = p_freq,
    proxima_cobranca = public.fn_proxima_data(current_date, p_freq)
  where id = v_r.id returning * into v_r;
  return v_r;
end $$;

create or replace function public.fn_pausar_recorrencia()
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  update public.recorrencia set status = 'pausada' where doador_id = auth.uid() and status = 'ativa' returning * into v_r;
  if v_r.id is null then raise exception 'nenhuma recorrência ativa' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo) values (v_r.id, 'pausada');
  return v_r;
end $$;

create or replace function public.fn_retomar_recorrencia()
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  update public.recorrencia set status = 'ativa', proxima_cobranca = public.fn_proxima_data(current_date, frequencia)
  where doador_id = auth.uid() and status = 'pausada' returning * into v_r;
  if v_r.id is null then raise exception 'nenhuma recorrência pausada' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo) values (v_r.id, 'retomada');
  perform public.fn_avaliar_marcos(auth.uid());
  return v_r;
end $$;

create or replace function public.fn_cancelar_recorrencia()
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  update public.recorrencia set status = 'cancelada', encerrada_em = now(), proxima_cobranca = null
  where doador_id = auth.uid() and status in ('ativa', 'pausada') returning * into v_r;
  if v_r.id is null then raise exception 'nenhuma recorrência para cancelar' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo) values (v_r.id, 'cancelada');
  return v_r;
end $$;

-- Cobrança simulada: acionada por job (n8n / pg_cron), nunca pelo usuário
create or replace function public.fn_processar_cobrancas(p_ate date default current_date)
returns integer language plpgsql security definer set search_path = public as $$
declare v_r record; v_n integer := 0; v_data date;
begin
  if not public.fn_contexto_admin() and not public.fn_e_coordenacao() then
    raise exception 'somente o job de cobrança' using errcode = '42501';
  end if;
  for v_r in select * from public.recorrencia where status = 'ativa' and proxima_cobranca is not null and proxima_cobranca <= p_ate loop
    v_data := v_r.proxima_cobranca;
    while v_data <= p_ate loop
      perform public.fn_confirmar_doacao(v_r.doador_id, v_r.valor_centavos, 'recorrente', v_r.meio, v_r.id, v_data::timestamptz + interval '9 hours');
      v_n := v_n + 1;
      v_data := public.fn_proxima_data(v_data, v_r.frequencia);
    end loop;
    update public.recorrencia set proxima_cobranca = v_data where id = v_r.id;
  end loop;
  return v_n;
end $$;

-- ------------------------------------------------------------
-- Compartilhamento
-- ------------------------------------------------------------
create or replace function public.fn_registrar_compartilhamento(p_conteudo public.conteudo_compartilhamento, p_rede public.canal_origem)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '42501'; end if;
  insert into public.compartilhamento (doador_id, conteudo, rede) values (auth.uid(), p_conteudo, p_rede) returning id into v_id;
  return v_id;
end $$;

-- ------------------------------------------------------------
-- Anonimização (direito de exclusão sem apagar documento fiscal)
-- ------------------------------------------------------------
create or replace function public.fn_anonimizar_doador(p_doador uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (p_doador = auth.uid() or public.fn_e_coordenacao()) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  update public.doador set nome_exibicao = 'Doador anonimizado', email = 'anon-' || p_doador || '@anonimizado.local',
    consent_comunicacao = false, consent_compartilhar_nome = false, anonimizado_em = now()
  where id = p_doador;
  update public.embaixador set ativo = false where doador_id = p_doador;
  update public.recorrencia set status = 'cancelada', encerrada_em = now(), proxima_cobranca = null
  where doador_id = p_doador and status in ('ativa','pausada');
end $$;
