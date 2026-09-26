begin;
select plan(16);

-- continuidade
select is(public.fn_meses_consecutivos('d0000000-0000-4000-8000-000000000001'), 14, 'Eduardo: 14 meses consecutivos');
select is(public.fn_meses_consecutivos('d0000000-0000-4000-8000-000000000002'), 0,  'Rafael (pontual há 5 meses): sequência zerada');
select is(public.fn_meses_consecutivos('d0000000-0000-4000-8000-000000000020'), 8,  'pausa há 3 meses congela e não zera a sequência');
select is(public.fn_meses_consecutivos('d0000000-0000-4000-8000-000000000021'), 0,  'cancelamento há 4 meses zera a sequência');

-- marcos
select is((select count(*) from v_conquistas where doador_id = 'd0000000-0000-4000-8000-000000000001' and trilha = 'doador'), 4::bigint, 'Eduardo: 4 marcos de doador');
select ok(not exists (select 1 from v_conquistas where doador_id = 'd0000000-0000-4000-8000-000000000001' and codigo = 'guardiao_educacao'), 'Guardião da Educação ainda pendente (nenhum ano-calendário completo)');
select is((select codigo from v_proximo_marco where doador_id = 'd0000000-0000-4000-8000-000000000001'), 'guardiao_educacao', 'próximo marco do Eduardo');
select is((select alcancada_em::date from v_conquistas where doador_id = 'd0000000-0000-4000-8000-000000000001' and codigo = 'impacto_continuo'),
          (select (date_trunc('month', current_date) - interval '11 months')::date + 11), 'data do Impacto Contínuo = 3ª doação da sequência');
select is((select array_agg(codigo order by ordem) from v_conquistas where doador_id = 'd0000000-0000-4000-8000-000000000003' and trilha = 'embaixador'),
          array['voz_da_causa','conector'], 'Renata: Voz da Causa e Conector (12 mobilizados < 25)');

-- certificado
select is((select numero_registro from certificado), 'EC-2026-000148', 'número do certificado do protótipo');
select is((select id from public.fn_emitir_certificado((select conquista_id from certificado))), (select id from certificado), 'emissão é idempotente');
select throws_ok($$ update certificado set numero_registro = 'X' $$, '42501', null, 'certificado é imutável');
select throws_ok($$ delete from conquista $$, '42501', null, 'conquista nunca é removida');
select is((select marco from public.fn_verificar_certificado('ec-2026-000148')), 'Guardião da Comunidade', 'verificação pública devolve o marco');
select is((select count(*) from public.fn_verificar_certificado('EC-2026-999999')), 0::bigint, 'número inexistente: vazio');

-- cobrança simulada
update recorrencia set proxima_cobranca = current_date - 40 where doador_id = 'd0000000-0000-4000-8000-000000000001';
select is(public.fn_processar_cobrancas(current_date), 2, 'job gera as cobranças mensais atrasadas (2 em 40 dias)');

select * from finish();
rollback;
