-- ============================================================
-- EbenézerConecta · 0012 · Anonimização completa (LGPD, art. 18, IV e VI)
-- 1. A coordenação pode executar pelo SQL Editor (contexto administrativo), não só pelo app
-- 2. Remove o dado pessoal também do cadastro de login (auth.users / auth.identities) e
--    impede novo acesso, sem apagar o registro — as doações ficam para fins fiscais, sem titular
-- ============================================================
create or replace function public.fn_anonimizar_doador(p_doador uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_anon text := 'anon-' || p_doador || '@anonimizado.local';
begin
  if not (p_doador = auth.uid() or public.fn_e_coordenacao() or public.fn_contexto_admin()) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  update public.doador set nome_exibicao = 'Doador anonimizado', email = v_anon,
    consent_comunicacao = false, consent_compartilhar_nome = false, anonimizado_em = now()
  where id = p_doador;
  update public.embaixador set ativo = false where doador_id = p_doador;
  update public.recorrencia set status = 'cancelada', encerrada_em = now(), proxima_cobranca = null
  where doador_id = p_doador and status in ('ativa', 'pausada');

  -- login: e-mail e metadados substituídos; senha invalidada (hash aleatório, sem senha conhecida)
  update auth.users set email = v_anon, raw_user_meta_data = '{}'::jsonb,
         encrypted_password = md5(random()::text || clock_timestamp()::text)
   where id = p_doador;
  update auth.identities set identity_data = jsonb_build_object('sub', p_doador::text, 'email', v_anon)
   where user_id = p_doador;
end $$;
