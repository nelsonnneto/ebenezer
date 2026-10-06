-- ============================================================
-- 0013 · Mês corrente em aberto na contagem de continuidade
-- ------------------------------------------------------------
-- Defeito: quando a última doação era do mês anterior (sequência
-- viva) e a cobrança do mês corrente ainda não tinha ocorrido, a
-- contagem começava no mês corrente, não encontrava doação e
-- devolvia 0. Na prática, todo doador recorrente aparecia com
-- 0 meses entre o dia 1º e o dia da sua cobrança.
-- Correção: o mês corrente sem doação é tratado como em aberto
-- e a contagem começa no último mês coberto.
-- ============================================================
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

  -- mês corrente sem doação fica em aberto: começa no último mês coberto
  v_mes := case when v_ultimo >= v_atual - interval '1 month' then v_ultimo else v_atual end;
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
