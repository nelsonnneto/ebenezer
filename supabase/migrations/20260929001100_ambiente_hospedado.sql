-- ============================================================
-- EbenézerConecta · 0011 · Prontidão para o Supabase hospedado (Bloco 4)
-- 1. pgcrypto: no Supabase hospedado a extensão vive no schema "extensions";
--    funções com search_path fixo precisam enxergá-lo (localmente o schema não existe e é ignorado)
-- 2. Limite de acessos no link público (/r/<slug>): protege a métrica de conversão contra
--    repetição automatizada sem guardar IP nem qualquer dado do visitante
-- ============================================================

-- ---------- 1. search_path com extensions ----------
alter function public.fn_emitir_certificado_interno(uuid) set search_path = public, extensions;
alter function public.fn_emitir_certificado(uuid)         set search_path = public, extensions;

-- ---------- 2. Limite de acessos por link ----------
-- Até 30 acessos por minuto por embaixador (ou pelo link institucional). Acima disso o acesso
-- não é registrado — a pessoa segue normalmente para a página pública, só não conta na métrica.
create index if not exists origem_embaixador_criada_idx on public.origem (embaixador_id, primeiro_acesso_em desc);

create or replace function public.fn_registrar_origem(p_slug text, p_canal public.canal_origem default 'direto')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_emb uuid; v_id uuid; v_recentes integer;
begin
  select id into v_emb from public.embaixador where slug = lower(p_slug) and ativo;
  select count(*) into v_recentes from public.origem
   where embaixador_id is not distinct from v_emb and primeiro_acesso_em > now() - interval '1 minute';
  if v_recentes >= 30 then return null; end if;
  insert into public.origem (embaixador_id, canal) values (v_emb, coalesce(p_canal, 'direto')) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.fn_registrar_origem(text, public.canal_origem) to anon, authenticated;

-- ---------- 3. Funções internas fora do alcance da API ----------
-- Correção de segurança: no Postgres toda função nasce executável por PUBLIC, e "revoke ... from anon"
-- não basta enquanto PUBLIC mantém o privilégio. Estas funções só podem rodar a partir de outras
-- funções security definer (que executam como dono) ou do job de cobrança.
revoke execute on function public.fn_confirmar_doacao(uuid, integer, public.tipo_doacao, public.meio_pagamento, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.fn_processar_cobrancas(date)           from public, anon, authenticated;
revoke execute on function public.fn_emitir_certificado_interno(uuid)    from public, anon, authenticated;
revoke execute on function public.fn_avaliar_marcos(uuid)                from public, anon, authenticated;
revoke execute on function public.fn_avaliar_marcos_embaixador(uuid)     from public, anon, authenticated;
revoke execute on function public.fn_origem_do_doador(uuid)              from public, anon, authenticated;
revoke execute on function public.fn_conceder_marco(uuid, text)          from public, anon;
grant  execute on function public.fn_conceder_marco(uuid, text)          to authenticated;   -- tem guarda própria (coordenação)
grant  execute on function public.fn_processar_cobrancas(date)           to service_role;
