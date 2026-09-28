-- ------------------------------------------------------------
-- Epílogo exclusivo do Supabase hospedado (não roda no banco local)
-- ------------------------------------------------------------

-- 1. Auth: o GoTrue hospedado não aceita colunas de token nulas nos usuários criados por SQL.
do $$
declare c text;
begin
  foreach c in array array['confirmation_token','recovery_token','email_change_token_new','email_change',
                           'email_change_token_current','phone_change','phone_change_token','reauthentication_token'] loop
    if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = c) then
      execute format('update auth.users set %1$I = coalesce(%1$I, %2$L) where email like %3$L', c, '', '%@exemplo.com.br');
    end if;
  end loop;
end $$;
update auth.identities
   set identity_data = identity_data || jsonb_build_object('email_verified', true, 'phone_verified', false)
 where provider = 'email' and user_id in (select id from auth.users where email like '%@exemplo.com.br');

-- 2. Storage: bucket público das imagens ilustrativas (as seis fotos são enviadas pelo painel)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

-- 3. Conferência: deve retornar 25 usuários, 25 doadores, 4 programas, 1 embaixador e as doações do seed
select (select count(*) from auth.users where email like '%@exemplo.com.br') as usuarios,
       (select count(*) from public.doador)       as doadores,
       (select count(*) from public.programa)     as programas,
       (select count(*) from public.embaixador)   as embaixadores,
       (select count(*) from public.doacao)       as doacoes,
       (select count(*) from public.publicacao)   as publicacoes,
       (select count(*) from storage.buckets where id = 'midia') as bucket_midia;
