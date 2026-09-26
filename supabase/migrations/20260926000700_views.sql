-- ============================================================
-- EbenézerConecta · 0007 · Views
-- security_invoker = true → a RLS da tabela se aplica (dado pessoal: só o próprio)
-- security_invoker = false → executa como dona; expõe SÓ agregados, já filtrados
-- ============================================================

-- Continuidade e totais do próprio doador
create view public.v_continuidade with (security_invoker = true) as
select d.id as doador_id,
       public.fn_meses_consecutivos(d.id)                    as meses_consecutivos,
       min(o.confirmada_em)::date                            as primeira_doacao_em,
       max(o.confirmada_em)::date                            as ultima_doacao_em,
       count(o.id) filter (where o.status = 'confirmada')    as doacoes_confirmadas,
       coalesce(sum(o.valor_centavos) filter (where o.status = 'confirmada'), 0)::bigint as valor_total_centavos
from public.doador d
left join public.doacao o on o.doador_id = d.id
group by d.id;

-- Conquistas do próprio doador, com certificado quando emitido
create view public.v_conquistas with (security_invoker = true) as
select q.id as conquista_id, q.doador_id, m.codigo, m.nome, m.trilha, m.ordem, m.descricao,
       q.alcancada_em, c.id as certificado_id, c.numero_registro, c.emitido_em
from public.conquista q
join public.marco m on m.id = q.marco_id
left join public.certificado c on c.conquista_id = q.id;

-- Trilha completa do doador: todos os marcos, com estado
create view public.v_trilha with (security_invoker = true) as
select d.id as doador_id, m.id as marco_id, m.codigo, m.nome, m.trilha, m.ordem, m.meses_requeridos, m.doadores_requeridos,
       q.id is not null as conquistado, q.alcancada_em
from public.doador d
cross join public.marco m
left join public.conquista q on q.doador_id = d.id and q.marco_id = m.id
where m.trilha = 'doador' or exists (select 1 from public.embaixador e where e.doador_id = d.id);

-- Próximo marco e progresso (barra da Home)
-- Marcos por meses: progresso = meses consecutivos ÷ requeridos.
-- Guardião da Educação (ciclo anual): progresso = meses com doação no ano-calendário corrente ÷ 12.
create view public.v_proximo_marco with (security_invoker = true) as
select t.doador_id, t.marco_id, t.codigo, t.nome,
       coalesce(t.meses_requeridos, 12) as meses_requeridos,
       case when t.meses_requeridos is not null then c.meses_consecutivos else a.meses_no_ano end as meses_atuais,
       least(1, (case when t.meses_requeridos is not null then c.meses_consecutivos else a.meses_no_ano end)::numeric
                / coalesce(t.meses_requeridos, 12)) as progresso,
       greatest(0, coalesce(t.meses_requeridos, 12) -
                (case when t.meses_requeridos is not null then c.meses_consecutivos else a.meses_no_ano end)) as meses_faltantes
from (
  select *, row_number() over (partition by doador_id order by ordem) as rn
  from public.v_trilha where trilha = 'doador' and not conquistado
) t
join public.v_continuidade c on c.doador_id = t.doador_id
left join lateral (
  select count(distinct date_trunc('month', realizada_em)) as meses_no_ano
  from public.doacao o
  where o.doador_id = t.doador_id and o.status = 'confirmada'
    and date_trunc('year', o.realizada_em) = date_trunc('year', now())
) a on true
where t.rn = 1;

-- Histórico de contribuições do próprio doador (linha do tempo)
create view public.v_historico with (security_invoker = true) as
select o.id, o.doador_id, o.realizada_em, o.tipo, o.meio, o.valor_centavos, o.status, o.recibo_numero,
       r.frequencia
from public.doacao o
left join public.recorrencia r on r.id = o.recorrencia_id;

-- Feed de publicações (a RLS de publicacao decide o que cada um vê)
create view public.v_feed with (security_invoker = true) as
select p.id, p.titulo, p.texto, p.cadencia, p.publicada_em, p.metrica_rotulo, p.metrica_valor, p.publico,
       pr.id as programa_id, pr.codigo as programa_codigo, pr.nome as programa,
       i.url_storage as imagem_url, i.descricao_alt as imagem_alt, i.ilustrativa as imagem_ilustrativa
from public.publicacao p
join public.programa pr on pr.id = p.programa_id
left join public.imagem i on i.id = p.imagem_id
where p.status = 'publicada';

-- Indicadores por programa e período (RLS de indicador: publico ou autenticado)
create view public.v_indicadores_periodo with (security_invoker = true) as
select i.programa_id, pr.codigo as programa_codigo, pr.nome as programa, i.periodo, i.tipo, i.valor, i.publico
from public.indicador i join public.programa pr on pr.id = i.programa_id;

-- Resumo do período para a Home: soma ou média por tipo, todos os programas ou um
create view public.v_indicadores_resumo with (security_invoker = true) as
select programa_id, programa, periodo,
       sum(valor) filter (where tipo = 'criancas_atendidas')      as criancas_atendidas,
       sum(valor) filter (where tipo = 'horas_atividade')         as horas_atividade,
       avg(valor) filter (where tipo = 'frequencia_media')        as frequencia_media,
       sum(valor) filter (where tipo = 'atividades_realizadas')   as atividades_realizadas
from public.v_indicadores_periodo
group by programa_id, programa, periodo;

-- ---------- Agregados coletivos (executam como dona; nunca expõem linha individual) ----------

-- Total arrecadado por mês, todos os doadores (gráfico da meta anual)
create view public.v_doacoes_mes as
select date_trunc('month', realizada_em)::date as periodo,
       sum(valor_centavos)::bigint as total_centavos,
       count(distinct doador_id)   as doadores
from public.doacao where status = 'confirmada'
group by 1;

-- Progresso das metas
create view public.v_meta_progresso as
select m.id as meta_id, m.tipo, m.rotulo, m.alvo, m.periodo_inicio, m.periodo_fim, m.programa_id, m.embaixador_id,
       case m.tipo
         when 'anual' then (select coalesce(sum(valor_centavos), 0) from public.doacao
                            where status = 'confirmada' and realizada_em::date between m.periodo_inicio and m.periodo_fim)
         else (select count(distinct d.doador_id) from public.doacao d join public.origem o on o.id = d.origem_id
               where o.embaixador_id = m.embaixador_id and d.status = 'confirmada')
       end::numeric as realizado
from public.meta m;

-- Painel do embaixador: só o próprio (ou coordenação), só agregados
create view public.v_rede_embaixador as
with base as (
  select e.id as embaixador_id, e.doador_id, e.slug,
         o.id as origem_id, o.canal, o.doador_id as referido_id
  from public.embaixador e
  left join public.origem o on o.embaixador_id = e.id
)
select b.embaixador_id, b.slug,
       count(distinct b.origem_id)                                                   as acessos_pelo_link,
       count(distinct d.doador_id)                                                   as doadores_mobilizados,
       coalesce(sum(d.valor_centavos), 0)::bigint                                    as valor_total_centavos,
       count(distinct r.doador_id)                                                   as recorrentes_originados,
       round(count(distinct d.doador_id)::numeric / nullif(count(distinct b.origem_id), 0), 3) as taxa_conversao
from base b
left join public.doacao d on d.origem_id = b.origem_id and d.status = 'confirmada'
left join public.recorrencia r on r.doador_id = d.doador_id and r.status in ('ativa','pausada')
where b.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()
group by b.embaixador_id, b.slug;

create view public.v_rede_origem_canal as
select e.id as embaixador_id, o.canal,
       count(distinct o.id)                                     as acessos,
       count(distinct d.doador_id)                              as doadores
from public.embaixador e
join public.origem o on o.embaixador_id = e.id
left join public.doacao d on d.origem_id = o.id and d.status = 'confirmada'
where e.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()
group by e.id, o.canal;

-- Materiais com o link do embaixador já injetado
create view public.v_materiais_embaixador as
select mc.id, mc.titulo, mc.descricao, mc.tipo, mc.url_storage, mc.ordem, e.id as embaixador_id,
       replace(mc.texto_pronto, '{{link}}', 'ebenezerconecta.org.br/r/' || e.slug) as texto_pronto
from public.material_campanha mc
cross join public.embaixador e
where mc.ativo and e.ativo and (e.doador_id = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin());
