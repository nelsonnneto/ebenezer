begin;
select plan(19);

-- ---------- anon ----------
set local role anon;
set local request.jwt.claim.role = 'anon';
select is((select count(*) from doacao), 0::bigint, 'anon não lê doações');
select is((select count(*) from doador), 0::bigint, 'anon não lê doadores');
select ok((select count(*) from v_doacoes_mes) > 0, 'anon lê totais agregados (landing)');
select is((select count(*) from v_feed), (select count(*) from publicacao where status = 'publicada' and publico), 'anon lê só publicações públicas');
select ok((select count(*) from indicador) > 0 and (select count(*) from indicador where not publico) = 0, 'anon lê só indicadores públicos');
select isnt(public.fn_registrar_origem('renata-c', 'instagram'), null, 'anon registra origem pelo link');
reset role;
select is((select canal from origem order by primeiro_acesso_em desc limit 1), 'instagram', 'origem registrada com o canal');

-- ---------- Rafael (doador) ----------
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
select is((select count(*) from doacao), 1::bigint, 'Rafael vê só a própria doação');
select is((select count(*) from doador), 1::bigint, 'Rafael vê só o próprio perfil');
select is((select count(*) from v_rede_embaixador), 0::bigint, 'Rafael não é embaixador: painel vazio');
select throws_ok($$ insert into conquista (doador_id, marco_id) values ('d0000000-0000-4000-8000-000000000002', (select id from marco where codigo='guardiao_comunidade')) $$,
  '42501', null, 'doador não insere conquista diretamente');
select throws_ok($$ select public.fn_processar_cobrancas() $$, '42501', null, 'doador não roda o job de cobrança');
select lives_ok($$ select public.fn_iniciar_recorrencia(5000, 'mensal') $$, 'Rafael inicia recorrência (US-01)');
select is((select count(*) from doacao where status = 'confirmada'), 2::bigint, 'primeira cobrança confirmada na hora');
select throws_ok($$ select public.fn_iniciar_recorrencia(5000, 'mensal') $$, '23505', null, 'segunda recorrência ativa é recusada');
select is((select frequencia from public.fn_alterar_recorrencia(12000, 'quinzenal')), 'quinzenal', 'altera valor e frequência (US-02)');
select is((select status from public.fn_pausar_recorrencia()), 'pausada', 'pausa sem justificativa');
select is((select count(*) from recorrencia_evento), 3::bigint, 'criada, alterada, pausada — cada ação vira evento');
select is((select count(*) from v_conquistas where codigo = 'primeiro_passo'), 1::bigint, 'Primeiro Passo mantido');

select * from finish();
rollback;
