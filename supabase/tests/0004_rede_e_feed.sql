begin;
select plan(11);

select is(public.fn_slug_base('Eduardo Mendes'), 'eduardo-m', 'slug: primeiro nome + inicial do sobrenome');
select is(public.fn_slug_base('João Vitor Ramos'), 'joao-r', 'slug remove acento');

-- metas de rede não vazam
set local role anon;
select is((select count(*) from v_meta_progresso where tipo = 'rede'), 0::bigint, 'anon não vê meta de rede de embaixador');
reset role;

-- Renata: evolução mensal soma os 12 mobilizados
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000003';
select is((select sum(novos_doadores) from v_rede_mes)::int, 12, 'Renata: 12 doadores mobilizados ao longo dos meses');
select is((select count(*) from v_meta_progresso where tipo = 'rede'), 1::bigint, 'Renata vê a própria meta de rede');
select ok((select bool_and(texto_pronto is null or texto_pronto like '%/r/renata-c%') from v_materiais_embaixador), 'materiais já trazem o link da Renata');

-- Eduardo vira embaixador sozinho; segunda chamada é idempotente
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
select is((select slug from public.fn_tornar_embaixador()), 'eduardo-m', 'Eduardo ativa o próprio link');
select is((select slug from public.fn_tornar_embaixador()), 'eduardo-m', 'ativação é idempotente');
select is((select count(*) from v_rede_embaixador), 1::bigint, 'painel do Eduardo existe e está vazio de referidos');
select is((select doadores_mobilizados from v_rede_embaixador), 0::bigint, 'nenhum referido ainda');

-- resumo do feed
select ok((public.fn_resumo_feed(current_date - 7, current_date) ->> 'publicacoes')::int >= 5, 'resumo da semana conta as publicações');

select * from finish();
rollback;
