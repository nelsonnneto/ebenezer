-- Anonimização: executável pela coordenação no SQL Editor e sem sobra de dado pessoal no login.
begin;
select plan(4);
select lives_ok($$ select public.fn_anonimizar_doador('d0000000-0000-4000-8000-000000000002') $$,
  'coordenação consegue anonimizar pelo SQL Editor (contexto administrativo)');
select is((select nome_exibicao from public.doador where id = 'd0000000-0000-4000-8000-000000000002'), 'Doador anonimizado', 'nome removido do perfil');
select is((select count(*)::int from auth.users where id = 'd0000000-0000-4000-8000-000000000002' and email like 'rafael%'), 0, 'e-mail removido do cadastro de login');
select ok((select count(*) from public.doacao where doador_id = 'd0000000-0000-4000-8000-000000000002') > 0, 'doações preservadas, sem titular identificável');
select * from finish();
rollback;
