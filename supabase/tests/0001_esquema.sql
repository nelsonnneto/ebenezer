begin;
select plan(20);

select has_table('public', t, 'tabela ' || t) from unnest(array[
  'programa','imagem','indicador','publicacao','material_campanha','meta','marco',
  'doador','embaixador','origem','recorrencia','recorrencia_evento','doacao',
  'conquista','certificado','compartilhamento']) as t;

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0::bigint, 'RLS habilitada em todas as tabelas');

select is((select count(*) from public.programa), 4::bigint, '4 programas do dossiê');
select is((select count(*) from public.marco), 10::bigint, '10 marcos: 5 doador + 5 embaixador');
select throws_ok(
  $$ insert into public.indicador (programa_id, periodo, tipo, valor) values ((select id from programa limit 1), '2026-09-15', 'horas_atividade', 1) $$,
  '23514', null, 'indicador rejeita período que não é 1º dia do mês');

select * from finish();
rollback;
