-- ------------------------------------------------------------
-- EbenézerConecta · LIMPEZA do projeto de demonstração no Supabase hospedado
-- Remove tudo o que dist/ebenezer-supabase-hospedado.sql cria (esquema, funções, views, tipos,
-- usuários de demonstração @exemplo.com.br e o gatilho em auth.users), para repetir a instalação
-- depois de uma execução interrompida. Use SOMENTE no projeto de demonstração: apaga o schema public.
-- O bucket "midia" e as fotos enviadas são preservados.
-- ------------------------------------------------------------
drop trigger if exists trg_novo_usuario on auth.users;

drop schema if exists seed_aux cascade;

do $$
declare q text;
begin
  -- nomes coletados antes de qualquer drop (o cascade remove dependentes no meio do caminho)
  foreach q in array coalesce((select array_agg(format('drop view if exists %I.%I cascade', s.nspname, c.relname))
      from pg_class c join pg_namespace s on s.oid = c.relnamespace
      where s.nspname = 'public' and c.relkind in ('v', 'm')), '{}') loop execute q; end loop;
  foreach q in array coalesce((select array_agg(format('drop table if exists %I.%I cascade', s.nspname, c.relname))
      from pg_class c join pg_namespace s on s.oid = c.relnamespace
      where s.nspname = 'public' and c.relkind in ('r', 'p')), '{}') loop execute q; end loop;
  foreach q in array coalesce((select array_agg(format('drop function if exists %I.%I(%s) cascade', s.nspname, p.proname, pg_get_function_identity_arguments(p.oid)))
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace
      where s.nspname = 'public' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')), '{}') loop execute q; end loop;
  foreach q in array coalesce((select array_agg(format('drop sequence if exists %I.%I cascade', s.nspname, c.relname))
      from pg_class c join pg_namespace s on s.oid = c.relnamespace
      where s.nspname = 'public' and c.relkind = 'S'), '{}') loop execute q; end loop;
  foreach q in array coalesce((select array_agg(format('drop type if exists %I.%I cascade', s.nspname, t.typname))
      from pg_type t join pg_namespace s on s.oid = t.typnamespace
      where s.nspname = 'public' and t.typtype = 'e'), '{}') loop execute q; end loop;
end $$;

-- Usuários de demonstração (depois do esquema, que tem chaves estrangeiras para auth.users)
delete from auth.identities where user_id in (select id from auth.users where email like '%@exemplo.com.br');
delete from auth.users where email like '%@exemplo.com.br';

-- Conferência: tudo zero significa que o projeto está pronto para receber o script de instalação
select (select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public') as objetos_public,
       (select count(*) from auth.users where email like '%@exemplo.com.br') as usuarios_demo;
