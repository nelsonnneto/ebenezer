-- ============================================================
-- EbenézerConecta · 0010 · Rede do embaixador, feed e consentimento (Bloco 3)
-- 1. Embaixador self-service: qualquer doador com ao menos uma doação ativa o próprio link
-- 2. Evolução mensal da rede (gráfico da Central do Embaixador)
-- 3. Resumo do feed por janela (balanço da semana, boletim do mês)
-- 4. Materiais com a imagem para download
-- 5. Metas de rede visíveis só ao próprio embaixador (correção de privacidade)
-- 6. Consentimentos do doador
-- ============================================================

-- ---------- 1. Embaixador self-service ----------
-- Slug legível: primeiro nome + inicial do último sobrenome, sem acento ("Eduardo Mendes" → "eduardo-m").
create or replace function public.fn_slug_base(p_nome text)
returns text language sql immutable as $$
  with n as (
    select regexp_split_to_array(
      lower(translate(trim(p_nome), 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')),
      '[^a-z0-9]+') as p
  )
  select case when cardinality(p) > 1 and p[cardinality(p)] <> ''
              then p[1] || '-' || left(p[cardinality(p)], 1)
              else coalesce(nullif(p[1], ''), 'apoiador') end
  from n;
$$;

create or replace function public.fn_tornar_embaixador()
returns public.embaixador language plpgsql security definer set search_path = public as $$
declare v_e public.embaixador; v_base text; v_slug text; v_i integer := 1;
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '42501'; end if;
  select * into v_e from public.embaixador where doador_id = auth.uid();
  if v_e.id is not null then
    if not v_e.ativo then raise exception 'link desativado pela coordenação' using errcode = '42501'; end if;
    return v_e;                                                   -- idempotente
  end if;
  if not exists (select 1 from public.doacao where doador_id = auth.uid() and status = 'confirmada') then
    raise exception 'a Central do Embaixador é liberada após a primeira contribuição' using errcode = 'P0001';
  end if;
  select public.fn_slug_base(nome_exibicao) into v_base from public.doador where id = auth.uid();
  v_base := left(v_base, 36);
  v_slug := v_base;
  while exists (select 1 from public.embaixador where slug = v_slug) or v_slug in ('instituto', 'conheca', 'admin') loop
    v_i := v_i + 1; v_slug := v_base || '-' || v_i;
  end loop;
  insert into public.embaixador (doador_id, slug) values (auth.uid(), v_slug) returning * into v_e;
  return v_e;
end $$;

-- ---------- 2. Evolução mensal da rede ----------
-- Mês em que cada pessoa referida fez a primeira doação confirmada. Só agregados, só para o próprio embaixador.
create view public.v_rede_mes as
with primeira as (
  select o.embaixador_id, d.doador_id, min(date_trunc('month', d.realizada_em))::date as mes
  from public.doacao d join public.origem o on o.id = d.origem_id
  where d.status = 'confirmada' and o.embaixador_id is not null
  group by o.embaixador_id, d.doador_id
)
select p.embaixador_id, p.mes, count(*)::int as novos_doadores
from primeira p join public.embaixador e on e.id = p.embaixador_id
where e.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()
group by p.embaixador_id, p.mes;
revoke all on public.v_rede_mes from anon;
grant select on public.v_rede_mes to authenticated;

-- ---------- 3. Resumo do feed ----------
create or replace function public.fn_resumo_feed(p_de date, p_ate date)
returns json language sql stable security invoker set search_path = public as $$
  select json_build_object(
    'publicacoes', count(*),
    'programas',   count(distinct programa_id),
    'diarias',     count(*) filter (where cadencia = 'diaria'),
    'semanais',    count(*) filter (where cadencia = 'semanal'),
    'mensais',     count(*) filter (where cadencia = 'mensal')
  )
  from public.publicacao
  where status = 'publicada' and publicada_em::date between p_de and p_ate;
$$;
grant execute on function public.fn_resumo_feed(date, date) to anon, authenticated;

-- ---------- 4. Materiais com imagem ----------
drop view if exists public.v_materiais_embaixador;
create view public.v_materiais_embaixador as
select mc.id, mc.titulo, mc.descricao, mc.tipo, mc.url_storage, mc.ordem, e.id as embaixador_id,
       i.url_storage as imagem_url, i.descricao_alt as imagem_alt,
       replace(mc.texto_pronto, '{{link}}', 'ebenezerconecta.org.br/r/' || e.slug) as texto_pronto
from public.material_campanha mc
cross join public.embaixador e
left join public.imagem i on i.id = mc.imagem_id
where mc.ativo and e.ativo and (e.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin());
revoke all on public.v_materiais_embaixador from anon;
grant select on public.v_materiais_embaixador to authenticated;

-- ---------- 5. Metas: a de rede só para o próprio embaixador ----------
drop view if exists public.v_meta_progresso;
create view public.v_meta_progresso as
select m.id as meta_id, m.tipo, m.rotulo, m.alvo, m.periodo_inicio, m.periodo_fim, m.programa_id, m.embaixador_id,
       case m.tipo
         when 'anual' then (select coalesce(sum(valor_centavos), 0) from public.doacao
                            where status = 'confirmada' and realizada_em::date between m.periodo_inicio and m.periodo_fim)
         else (select count(distinct d.doador_id) from public.doacao d join public.origem o on o.id = d.origem_id
               where o.embaixador_id = m.embaixador_id and d.status = 'confirmada')
       end::numeric as realizado
from public.meta m
where m.tipo = 'anual'
   or exists (select 1 from public.embaixador e where e.id = m.embaixador_id
              and (e.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()));
grant select on public.v_meta_progresso to anon, authenticated;

-- ---------- 6. Consentimentos ----------
create or replace function public.fn_atualizar_consentimento(p_comunicacao boolean, p_exibir_nome boolean default null)
returns public.doador language plpgsql security definer set search_path = public as $$
declare v_d public.doador;
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '42501'; end if;
  update public.doador set
    consent_comunicacao = p_comunicacao,
    consent_comunicacao_em = case when p_comunicacao is distinct from consent_comunicacao then now() else consent_comunicacao_em end,
    consent_compartilhar_nome = coalesce(p_exibir_nome, consent_compartilhar_nome)
  where id = auth.uid() returning * into v_d;
  return v_d;
end $$;
