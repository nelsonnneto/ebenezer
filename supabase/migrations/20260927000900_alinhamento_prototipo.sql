-- ============================================================
-- EbenézerConecta · 0009 · Alinhamento com o protótipo (Figma)
-- 1. Guardião da Educação = 24 meses consecutivos (tela Minha Jornada / Certificado)
-- 2. Pausa com prazo (1–3 meses) e retomada automática (tela Gerenciar Recorrência)
-- 3. Certificado emitido automaticamente a cada marco ("cada marco gera um certificado")
-- 4. Painel de impacto agregado por ano e programa (Home)
-- ============================================================

-- ---------- 1. Marcos: sem regra especial para o ciclo completo ----------
update public.marco set meses_requeridos = 24, descricao = 'Vinte e quatro meses consecutivos de apoio — um ciclo completo do programa de reforço.'
where codigo = 'guardiao_educacao';

create or replace function public.fn_avaliar_marcos(p_doador uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_meses integer;
begin
  if not exists (select 1 from public.doacao where doador_id = p_doador and status = 'confirmada') then return; end if;

  insert into public.conquista (doador_id, marco_id, alcancada_em)
  select p_doador, m.id, (select min(confirmada_em) from public.doacao where doador_id = p_doador and status = 'confirmada')
  from public.marco m where m.codigo = 'primeiro_passo'
  on conflict do nothing;

  -- a data da conquista é a da doação que completou a sequência
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
  where m.trilha = 'doador' and m.codigo <> 'primeiro_passo'
    and m.meses_requeridos is not null and m.meses_requeridos <= v_meses
  on conflict do nothing;
end $$;

drop view if exists public.v_proximo_marco;
create view public.v_proximo_marco with (security_invoker = true) as
select t.doador_id, t.marco_id, t.codigo, t.nome,
       t.meses_requeridos::integer as meses_requeridos,
       c.meses_consecutivos as meses_atuais,
       least(1, c.meses_consecutivos::numeric / t.meses_requeridos) as progresso,
       greatest(0, t.meses_requeridos - c.meses_consecutivos) as meses_faltantes
from (
  select *, row_number() over (partition by doador_id order by ordem) as rn
  from public.v_trilha where trilha = 'doador' and not conquistado and meses_requeridos is not null
) t
join public.v_continuidade c on c.doador_id = t.doador_id
where t.rn = 1;

-- ---------- 2. Pausa com prazo ----------
alter table public.recorrencia add column retomar_em date;
comment on column public.recorrencia.retomar_em is 'Data de retomada automática de uma pausa com prazo. Nula = pausa sem prazo.';

drop function if exists public.fn_pausar_recorrencia();
create or replace function public.fn_pausar_recorrencia(p_meses integer default null)
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  if p_meses is not null and p_meses not between 1 and 3 then
    raise exception 'a pausa vai de 1 a 3 meses' using errcode = '22023';
  end if;
  update public.recorrencia
     set status = 'pausada',
         retomar_em = case when p_meses is null then null else (current_date + (p_meses || ' months')::interval)::date end
   where doador_id = auth.uid() and status = 'ativa'
  returning * into v_r;
  if v_r.id is null then raise exception 'nenhuma recorrência ativa' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo) values (v_r.id, 'pausada');
  return v_r;
end $$;

create or replace function public.fn_retomar_recorrencia()
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  update public.recorrencia set status = 'ativa', retomar_em = null, proxima_cobranca = public.fn_proxima_data(current_date, frequencia)
  where doador_id = auth.uid() and status = 'pausada' returning * into v_r;
  if v_r.id is null then raise exception 'nenhuma recorrência pausada' using errcode = 'P0002'; end if;
  insert into public.recorrencia_evento (recorrencia_id, tipo) values (v_r.id, 'retomada');
  perform public.fn_avaliar_marcos(auth.uid());
  return v_r;
end $$;

create or replace function public.fn_processar_cobrancas(p_ate date default current_date)
returns integer language plpgsql security definer set search_path = public as $$
declare v_r record; v_n integer := 0; v_data date;
begin
  if not public.fn_contexto_admin() and not public.fn_e_coordenacao() then
    raise exception 'somente o job de cobrança' using errcode = '42501';
  end if;

  -- retomada automática das pausas vencidas
  with retomadas as (
    update public.recorrencia
       set status = 'ativa', proxima_cobranca = retomar_em, retomar_em = null
     where status = 'pausada' and retomar_em is not null and retomar_em <= p_ate
    returning id
  )
  insert into public.recorrencia_evento (recorrencia_id, tipo) select id, 'retomada' from retomadas;

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
revoke execute on function public.fn_processar_cobrancas(date) from anon, authenticated;

-- ---------- 3. Certificado automático ----------
-- Numeração: o protótipo exibe EC-2026-000148 para o 4º marco do doador de demonstração.
alter sequence public.certificado_seq restart with 145;

create or replace function public.fn_emitir_certificado_interno(p_conquista uuid)
returns public.certificado language plpgsql security definer set search_path = public as $$
declare v_c public.conquista; v_cert public.certificado;
begin
  select * into v_cert from public.certificado where conquista_id = p_conquista;
  if v_cert.id is not null then return v_cert; end if;
  select * into v_c from public.conquista where id = p_conquista;
  -- o certificado nasce com o marco: a data de emissão é a da conquista (nunca no futuro)
  insert into public.certificado (conquista_id, numero_registro, hash_verificacao, emitido_em)
  values (p_conquista,
          'EC-' || to_char(coalesce(v_c.alcancada_em, now()), 'YYYY') || '-' || lpad(nextval('public.certificado_seq')::text, 6, '0'),
          encode(digest(v_c.doador_id::text || v_c.marco_id::text || v_c.alcancada_em::text, 'sha256'), 'hex'),
          least(coalesce(v_c.alcancada_em, now()), now()))
  returning * into v_cert;
  return v_cert;
end $$;
revoke execute on function public.fn_emitir_certificado_interno(uuid) from anon, authenticated;

create or replace function public.fn_emitir_certificado(p_conquista uuid)
returns public.certificado language plpgsql security definer set search_path = public as $$
declare v_c public.conquista;
begin
  select * into v_c from public.conquista where id = p_conquista;
  if v_c.id is null then raise exception 'conquista inexistente' using errcode = 'P0002'; end if;
  if not (v_c.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()) then
    raise exception 'sem permissão para emitir este certificado' using errcode = '42501';
  end if;
  return public.fn_emitir_certificado_interno(p_conquista);
end $$;

create or replace function public.trg_fn_conquista_certificado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_emitir_certificado_interno(new.id);
  return new;
end $$;
create trigger trg_conquista_certificado after insert on public.conquista
  for each row execute function public.trg_fn_conquista_certificado();

-- ---------- 4. Painel de impacto (Home e Minha Jornada) ----------
-- Semântica de agregação no ano, definida aqui e não na tela:
--   crianças atendidas = valor do mês mais recente (contagem não se soma entre meses)
--   horas e atividades  = soma dos meses
--   frequência média    = média dos meses
create or replace function public.fn_painel_impacto(p_ano integer default null, p_programa text default null,
                                                    p_de date default null, p_ate date default null)
returns json language sql stable security invoker set search_path = public as $$
  with janela as (
    select coalesce(p_de, make_date(coalesce(p_ano, extract(year from current_date)::int), 1, 1)) as de,
           coalesce(p_ate, make_date(coalesce(p_ano, extract(year from current_date)::int), 12, 31)) as ate
  ),
  base as (
    select i.* , pr.codigo, pr.nome, pr.faixa_etaria
    from public.indicador i join public.programa pr on pr.id = i.programa_id, janela j
    where i.periodo between j.de and j.ate and (p_programa is null or pr.codigo = p_programa)
  ),
  ultimo as (select max(periodo) as periodo from base),
  por_programa as (
    select codigo, nome, faixa_etaria,
           max(valor) filter (where tipo = 'criancas_atendidas' and periodo = (select periodo from ultimo)) as criancas,
           sum(valor) filter (where tipo = 'horas_atividade') as horas,
           round(avg(valor) filter (where tipo = 'frequencia_media')) as frequencia,
           sum(valor) filter (where tipo = 'atividades_realizadas') as atividades
    from base group by codigo, nome, faixa_etaria
  )
  select json_build_object(
    'de', (select de from janela), 'ate', (select ate from janela), 'ultimo_mes', (select periodo from ultimo),
    'criancas_atendidas', coalesce((select sum(criancas) from por_programa), 0),
    'horas_atividade',    coalesce((select sum(horas) from por_programa), 0),
    'frequencia_media',   coalesce((select round(avg(valor)) from base where tipo = 'frequencia_media'), 0),
    'atividades',         coalesce((select sum(atividades) from por_programa), 0),
    'programas', coalesce((select json_agg(p order by p.nome) from por_programa p), '[]'::json)
  );
$$;
grant execute on function public.fn_painel_impacto(integer, text, date, date) to anon, authenticated;

-- ---------- 5. Alteração vale "a partir da próxima cobrança" (tela Gerenciar Recorrência) ----------
-- A data da próxima cobrança não se move ao alterar valor ou frequência; a nova frequência conta dali em diante.
create or replace function public.fn_alterar_recorrencia(p_valor integer, p_freq public.frequencia_recorrencia)
returns public.recorrencia language plpgsql security definer set search_path = public as $$
declare v_r public.recorrencia;
begin
  select * into v_r from public.recorrencia where doador_id = auth.uid() and status = 'ativa';
  if v_r.id is null then raise exception 'nenhuma recorrência ativa' using errcode = 'P0002'; end if;
  if v_r.valor_centavos = p_valor and v_r.frequencia = p_freq then return v_r; end if;   -- nada mudou: nenhum evento
  insert into public.recorrencia_evento (recorrencia_id, tipo, valor_anterior, valor_novo, freq_anterior, freq_nova)
  values (v_r.id, 'alterada', v_r.valor_centavos, p_valor, v_r.frequencia, p_freq);
  update public.recorrencia set valor_centavos = p_valor, frequencia = p_freq
  where id = v_r.id returning * into v_r;
  return v_r;
end $$;
