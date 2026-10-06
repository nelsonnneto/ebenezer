-- Continuidade com o mês corrente em aberto (migração 0013): antes da cobrança do mês, a sequência não zera.
begin;
select plan(2);
-- Rafael (doação única há 5 meses) passa a ter doações nos dois meses anteriores e nenhuma no mês corrente
select public.fn_confirmar_doacao('d0000000-0000-4000-8000-000000000002', 5000, 'unica', 'pix', null,
  (date_trunc('month', now()) - interval '2 months' + interval '9 days')::timestamptz);
select public.fn_confirmar_doacao('d0000000-0000-4000-8000-000000000002', 5000, 'unica', 'pix', null,
  (date_trunc('month', now()) - interval '1 month' + interval '9 days')::timestamptz);
select is(public.fn_meses_consecutivos('d0000000-0000-4000-8000-000000000002'), 2,
  'mês corrente ainda sem doação fica em aberto: a sequência dos meses anteriores é mantida');
select is((select meses_consecutivos from public.v_continuidade where doador_id = 'd0000000-0000-4000-8000-000000000002'), 2,
  'a view lida pelo app mostra a mesma contagem');
select * from finish();
rollback;
