-- Prontidão para o ambiente hospedado: limite do link público e search_path das funções de certificado.
begin;
select plan(6);

create temp table antes as
  select count(*)::int as n from public.origem o join public.embaixador e on e.id = o.embaixador_id
  where e.slug = 'renata-c' and o.primeiro_acesso_em > now() - interval '1 minute';

select is(
  (select count(*)::int from (select public.fn_registrar_origem('renata-c', 'whatsapp') as id from generate_series(1, 40)) s where id is not null),
  greatest(0, 30 - (select n from antes)),
  'link público registra no máximo 30 acessos por minuto por embaixador');

select is(public.fn_registrar_origem('renata-c', 'whatsapp'), null, 'acima do limite o acesso não é registrado');

select ok(
  (select array_to_string(proconfig, ',') like '%extensions%' from pg_proc where proname = 'fn_emitir_certificado_interno'),
  'emissão de certificado enxerga o schema extensions (pgcrypto no Supabase hospedado)');

select ok(not has_function_privilege('anon', 'public.fn_confirmar_doacao(uuid, integer, public.tipo_doacao, public.meio_pagamento, uuid, timestamptz)', 'execute')
      and not has_function_privilege('authenticated', 'public.fn_confirmar_doacao(uuid, integer, public.tipo_doacao, public.meio_pagamento, uuid, timestamptz)', 'execute'),
  'ninguém confirma doação pela API: só pelas RPCs de doação e pelo job');
select ok(not has_function_privilege('authenticated', 'public.fn_emitir_certificado_interno(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.fn_avaliar_marcos(uuid)', 'execute'),
  'emissão interna de certificado e avaliação de marcos não são chamáveis pela API');
select ok(has_function_privilege('authenticated', 'public.fn_doar_unica(integer, public.meio_pagamento)', 'execute'),
  'a doação pelo app continua funcionando');
select * from finish();
rollback;
