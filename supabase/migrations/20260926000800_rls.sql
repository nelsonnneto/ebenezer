-- ============================================================
-- EbenézerConecta · 0008 · Row Level Security
-- A política de acesso mora no banco: nenhum front consegue violá-la.
-- Sem política = negado. Escrita em conquista/certificado só por função.
-- ============================================================

alter table public.doador             enable row level security;
alter table public.embaixador         enable row level security;
alter table public.origem             enable row level security;
alter table public.recorrencia        enable row level security;
alter table public.recorrencia_evento enable row level security;
alter table public.doacao             enable row level security;
alter table public.conquista          enable row level security;
alter table public.certificado        enable row level security;
alter table public.compartilhamento   enable row level security;
alter table public.programa           enable row level security;
alter table public.imagem             enable row level security;
alter table public.indicador          enable row level security;
alter table public.publicacao         enable row level security;
alter table public.material_campanha  enable row level security;
alter table public.meta               enable row level security;
alter table public.marco              enable row level security;

-- ---------- Domínio do doador: só as próprias linhas; coordenação lê tudo ----------
create policy doador_proprio_select on public.doador for select to authenticated
  using (id = auth.uid() or public.fn_e_coordenacao());
create policy doador_proprio_update on public.doador for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and papel = (select papel from public.doador where id = auth.uid()));
create policy doador_coord_update on public.doador for update to authenticated
  using (public.fn_e_coordenacao()) with check (true);

create policy embaixador_select on public.embaixador for select to authenticated
  using (doador_id = auth.uid() or public.fn_e_coordenacao());
create policy embaixador_slug_publico on public.embaixador for select to anon
  using (ativo);                                            -- o link precisa resolver antes do login
create policy embaixador_coord_write on public.embaixador for all to authenticated
  using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());

-- origem: criada por função (anon), lida só pela coordenação; o embaixador vê agregados pelas views
create policy origem_coord_select on public.origem for select to authenticated
  using (public.fn_e_coordenacao());

-- ---------- Contribuição: só as próprias; escrita só por RPC ----------
create policy recorrencia_select on public.recorrencia for select to authenticated
  using (doador_id = auth.uid() or public.fn_e_coordenacao());
create policy recorrencia_evento_select on public.recorrencia_evento for select to authenticated
  using (exists (select 1 from public.recorrencia r where r.id = recorrencia_id and (r.doador_id = auth.uid() or public.fn_e_coordenacao())));
create policy doacao_select on public.doacao for select to authenticated
  using (doador_id = auth.uid() or public.fn_e_coordenacao());
create policy doacao_coord_status on public.doacao for update to authenticated
  using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());

-- ---------- Reconhecimento: leitura própria; nenhuma escrita direta ----------
create policy conquista_select on public.conquista for select to authenticated
  using (doador_id = auth.uid() or public.fn_e_coordenacao());
create policy certificado_select on public.certificado for select to authenticated
  using (exists (select 1 from public.conquista q where q.id = conquista_id and (q.doador_id = auth.uid() or public.fn_e_coordenacao())));
create policy compartilhamento_select on public.compartilhamento for select to authenticated
  using (doador_id = auth.uid() or public.fn_e_coordenacao());

-- ---------- Institucional: leitura ampla; escrita só coordenação ----------
create policy programa_read on public.programa for select to anon, authenticated using (ativo or public.fn_e_coordenacao());
create policy marco_read    on public.marco    for select to anon, authenticated using (true);
create policy imagem_read   on public.imagem   for select to anon, authenticated using (true);

create policy indicador_read on public.indicador for select to anon, authenticated
  using (publico or auth.role() = 'authenticated');
create policy publicacao_read on public.publicacao for select to anon, authenticated
  using ((status = 'publicada' and (publico or auth.role() = 'authenticated')) or public.fn_e_coordenacao());
create policy material_read on public.material_campanha for select to authenticated
  using (ativo or public.fn_e_coordenacao());
create policy meta_read on public.meta for select to anon, authenticated using (true);

create policy programa_coord  on public.programa          for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy imagem_coord    on public.imagem            for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy indicador_coord on public.indicador         for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy publicacao_coord on public.publicacao       for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy material_coord  on public.material_campanha for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy meta_coord      on public.meta              for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());
create policy marco_coord     on public.marco             for all to authenticated using (public.fn_e_coordenacao()) with check (public.fn_e_coordenacao());

-- ---------- Views agregadas e RPCs: quem pode chamar ----------
revoke all on public.v_doacoes_mes, public.v_meta_progresso, public.v_rede_embaixador, public.v_rede_origem_canal, public.v_materiais_embaixador from anon;
grant select on public.v_doacoes_mes, public.v_meta_progresso, public.v_rede_embaixador, public.v_rede_origem_canal, public.v_materiais_embaixador to authenticated;
grant select on public.v_doacoes_mes, public.v_meta_progresso to anon;   -- landing pública: só totais

revoke execute on function public.fn_processar_cobrancas(date) from anon, authenticated;
grant  execute on function public.fn_processar_cobrancas(date) to service_role;
revoke execute on function public.fn_confirmar_doacao(uuid, integer, public.tipo_doacao, public.meio_pagamento, uuid, timestamptz) from anon, authenticated;
revoke execute on function public.fn_conceder_marco(uuid, text) from anon;
grant  execute on function public.fn_registrar_origem(text, public.canal_origem) to anon, authenticated;
grant  execute on function public.fn_verificar_certificado(text) to anon, authenticated;
