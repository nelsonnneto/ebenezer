-- ============================================================
-- EbenézerConecta · seed.sql · DADOS SINTÉTICOS
-- Nenhum nome, e-mail, número ou indicador corresponde a pessoa
-- ou registro real do Instituto (regra 1 do bloco 6 do dossiê).
-- Datas são relativas ao mês corrente: a demo continua coerente
-- em qualquer data em que o seed for executado.
-- Senha de todos os usuários de demonstração: Ebenezer2026!
-- ============================================================
set client_min_messages = warning;

-- ------------------------------------------------------------
-- 1. Catálogos
-- ------------------------------------------------------------
insert into public.programa (codigo, nome, faixa_etaria, cadencia, descricao, ordem) values
  ('lab_sonhos',        'Laboratório de Sonhos', '7 a 11 anos', 'sábados',           'Parte da aspiração profissional da criança e a conecta a profissionais e espaços que ampliem seu repertório.', 1),
  ('reforco',           'Reforço Escolar',       '7 a 11 anos', 'segunda a sexta',   'Inglês, português, matemática e projeto de vida, em dois turnos de vinte crianças.', 2),
  ('primeira_infancia', 'Primeira Infância',     '3 a 5 anos',  'segunda a sexta',   'Familiarização com o ambiente e a rotina do Instituto antes dos programas de 7 a 11 anos.', 3),
  ('vivencia',          'Vivência Terapêutica',  '7 a 11 anos', 'sábados de manhã',  'Conduzida pela psicóloga. Conteúdo clínico: sem indicador nem publicação nas telas do doador (bloco 6).', 4);

insert into public.marco (codigo, trilha, nome, descricao, meses_requeridos, doadores_requeridos, ordem) values
  ('primeiro_passo',       'doador', 'Primeiro Passo',          'Sua primeira contribuição ao Instituto.', 1, null, 1),
  ('impacto_continuo',     'doador', 'Impacto Contínuo',        'Três meses consecutivos de apoio.', 3, null, 2),
  ('raizes_fortes',        'doador', 'Raízes Fortes',           'Seis meses consecutivos de apoio.', 6, null, 3),
  ('guardiao_comunidade',  'doador', 'Guardião da Comunidade',  'Doze meses consecutivos de apoio.', 12, null, 4),
  ('guardiao_educacao',    'doador', 'Guardião da Educação',    'Vinte e quatro meses consecutivos de apoio — um ciclo completo do programa de reforço.', 24, null, 5),
  ('voz_da_causa',         'embaixador', 'Voz da Causa',        'Primeiro compartilhamento com a sua rede.', null, null, 1),
  ('conector',             'embaixador', 'Conector',            'Cinco pessoas da sua rede passaram a doar.', null, 5, 2),
  ('mobilizador',          'embaixador', 'Mobilizador',         'Vinte e cinco pessoas da sua rede passaram a doar.', null, 25, 3),
  ('multiplicador',        'embaixador', 'Multiplicador de Impacto', 'Meta de arrecadação da sua rede atingida.', null, null, 4),
  ('embaixador_ebenezer',  'embaixador', 'Embaixador Ebenézer', 'Reconhecimento anual concedido pela coordenação.', null, null, 5);

insert into public.imagem (id, url_storage, descricao_alt, ilustrativa) values
  ('a0000000-0000-4000-8000-000000000001', 'midia/01-dia-de-arte.jpg',       'Crianças desenhando com lápis de cor em uma mesa, acompanhadas por uma educadora.', true),
  ('a0000000-0000-4000-8000-000000000002', 'midia/02-reforco-escolar.jpg',   'Educadora orientando quatro crianças com cadernos abertos em sala de aula.', true),
  ('a0000000-0000-4000-8000-000000000003', 'midia/03-primeira-infancia.jpg', 'Crianças pequenas explorando bandejas com materiais coloridos.', true),
  ('a0000000-0000-4000-8000-000000000004', 'midia/04-tecnologia.jpg',        'Educador orientando jovens em computadores.', true),
  ('a0000000-0000-4000-8000-000000000005', 'midia/05-roda-de-conversa.jpg',  'Crianças e educadores sentados em roda, sorrindo.', true),
  ('a0000000-0000-4000-8000-000000000006', 'midia/06-patio-grupo.jpg',       'Grupo de crianças e educadores em pátio ao ar livre.', true);

insert into public.material_campanha (titulo, descricao, tipo, imagem_id, url_storage, texto_pronto, ordem) values
  ('Cards para redes sociais', '3 formatos · feed, stories e capa', 'card', 'a0000000-0000-4000-8000-000000000004', 'materiais/cards-redes-sociais.zip', null, 1),
  ('Texto para WhatsApp', 'mensagem curta com o link', 'texto', null, null,
   'Oi! Faço parte da comunidade que sustenta o Instituto Social Ebenézer, no Jardim Ângela. Eles acompanham 120 crianças em quatro programas e mostram o resultado todo mês. Se quiser conhecer: {{link}}', 2),
  ('Post para LinkedIn', 'texto longo + arte institucional', 'post', 'a0000000-0000-4000-8000-000000000004', null,
   'Há alguns meses apoio o Instituto Social Ebenézer, que atende crianças de 3 a 11 anos no Jardim Ângela, em São Paulo. O que me convenceu não foi a emoção — foi a transparência: indicadores agregados por programa, publicados todo mês, e nenhuma criança exposta. Se você procura uma causa que presta contas, conheça: {{link}}', 3),
  ('Assinatura de e-mail', 'imagem com o link de convite', 'assinatura', 'a0000000-0000-4000-8000-000000000006', 'materiais/assinatura-email.png', null, 4);

-- ------------------------------------------------------------
-- 2. Usuários (auth) → perfis (trigger)
-- ------------------------------------------------------------
create temp table seed_pessoas (n int, id uuid, nome text, email text, papel public.papel_usuario default 'doador');
insert into seed_pessoas (n, id, nome, email, papel) values
  (0,  'd0000000-0000-4000-8000-000000000000', 'Juliana Prado',   'coordenacao@exemplo.com.br', 'coordenacao'),
  (1,  'd0000000-0000-4000-8000-000000000001', 'Eduardo Mendes',  'eduardo@exemplo.com.br', 'doador'),
  (2,  'd0000000-0000-4000-8000-000000000002', 'Rafael Nogueira', 'rafael@exemplo.com.br', 'doador'),
  (3,  'd0000000-0000-4000-8000-000000000003', 'Renata Coutinho', 'renata@exemplo.com.br', 'doador');
insert into seed_pessoas (n, id, nome, email)
select 3 + g, ('d0000000-0000-4000-8000-0000000000' || lpad((3 + g)::text, 2, '0'))::uuid, nome, lower(replace(split_part(nome, ' ', 1), 'ç', 'c')) || g || '@exemplo.com.br'
from unnest(array[
  'Ana Beatriz Farias','Bruno Cardoso','Camila Teixeira','Diego Albuquerque','Elaine Moraes','Fábio Siqueira','Gabriela Lins',
  'Henrique Prado','Isabela Fontes','João Vitor Ramos','Karina Duarte','Leonardo Assis','Mariana Peixoto','Nicolas Barreto',
  'Otávio Rezende','Patrícia Vilela','Rodrigo Esteves','Sabrina Lacerda','Thiago Monteiro','Vanessa Queiroz','William Antunes'
]) with ordinality as t(nome, g);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
       crypt('Ebenezer2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('nome', nome),
       now() - interval '15 months', now()
from seed_pessoas;
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email), now(), now(), now() from seed_pessoas;

update public.doador d set papel = p.papel, consent_comunicacao = true, consent_comunicacao_em = now() - interval '15 months'
from seed_pessoas p where p.id = d.id;

-- ------------------------------------------------------------
-- 3. Embaixadora e origens da rede (Renata)
-- ------------------------------------------------------------
insert into public.embaixador (id, doador_id, slug, ativo_desde, ativado_por)
values ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'renata-c', now() - interval '11 months', 'd0000000-0000-4000-8000-000000000000');

-- 67 acessos pelo link, distribuídos por canal; 12 viram doadores (pessoas 4..15)
do $$
declare v_canais public.canal_origem[] := array['whatsapp','whatsapp','whatsapp','linkedin','linkedin','instagram','evento','x','facebook','direto'];
        i int;
begin
  for i in 1..67 loop
    insert into public.origem (embaixador_id, canal, primeiro_acesso_em)
    values ('e0000000-0000-4000-8000-000000000001', v_canais[1 + (i * 7) % 10], now() - ((300 - i * 4) || ' days')::interval);
  end loop;
end $$;
-- vincula as 12 primeiras origens (WhatsApp 6, LinkedIn 3, evento 2, direto 1) aos doadores 4..15
with alvo as (
  select p.id as doador_id, row_number() over (order by p.n) as rn from seed_pessoas p where p.n between 4 and 15
), canais as (
  select unnest(array['whatsapp','whatsapp','whatsapp','whatsapp','whatsapp','whatsapp','linkedin','linkedin','linkedin','evento','evento','direto'])::public.canal_origem as canal,
         generate_series(1, 12) as rn
), origens as (
  select o.id, row_number() over (order by o.primeiro_acesso_em) as rn from public.origem o
)
update public.origem o set doador_id = a.doador_id, vinculada_em = o.primeiro_acesso_em + interval '2 hours', canal = c.canal
from alvo a join canais c on c.rn = a.rn join origens g on g.rn = a.rn
where o.id = g.id;

-- ------------------------------------------------------------
-- 4. Contribuições (relativas ao mês corrente)
-- ------------------------------------------------------------
create temp table seed_plano (
  n int, meses_atras_inicio int, meses int, valor int, freq public.frequencia_recorrencia default 'mensal',
  meio public.meio_pagamento default 'simulado', meio_ref text, pausa_em int, cancela_em int, altera_em int, altera_para int, dia int default 12
);
-- n | início (meses atrás) | meses de doação | valor | ...
insert into seed_plano (n, meses_atras_inicio, meses, valor, meio, meio_ref, altera_em, altera_para, dia) values
  (1, 13, 14, 10000, 'cartao', 'cartão final 4417', 7, 12000, 12);           -- Eduardo: 14 meses, R$100 → R$120 há 7 meses
insert into seed_plano (n, meses_atras_inicio, meses, valor, dia) values
  (4, 9, 10,  5000, 5), (5, 8, 9, 15000, 18), (6, 7, 8, 20000, 3), (7, 6, 7, 5000, 22),
  (8, 5, 6, 10000, 9), (9, 4, 5, 8000, 14), (10, 2, 3, 12000, 27),                       -- 7 recorrentes originados por Renata
  (16, 12, 13, 5000, 6), (17, 11, 12, 25000, 15), (18, 10, 11, 3000, 20), (19, 9, 10, 7500, 8); -- recorrentes antigos
insert into seed_plano (n, meses_atras_inicio, meses, valor, pausa_em, dia) values
  (20, 11, 8, 6000, 3, 11);                                                   -- pausado há 3 meses, sem quebra de sequência
insert into seed_plano (n, meses_atras_inicio, meses, valor, cancela_em, dia) values
  (21, 12, 8, 4000, 4, 4);                                                    -- cancelado há 4 meses: sequência zerada

-- Doações únicas: pessoa | meses atrás | valor
create temp table seed_unicas (n int, meses_atras int, valor int, dia int default 15);
insert into seed_unicas values
  (2, 5, 8000, 21),                                                           -- Rafael: um Pix, cinco meses atrás
  (11, 3, 15000, 2), (12, 2, 30000, 19), (13, 1, 5000, 9), (14, 0, 10000, 6), (15, 4, 20000, 25),  -- 5 pontuais originados
  (22, 6, 50000, 10), (23, 2, 12000, 17), (24, 0, 25000, 3),
  (3, 10, 20000, 12), (3, 4, 20000, 12);                                      -- Renata contribui também, pontualmente

do $$
declare p record; u record; v_id uuid; v_doador uuid; v_mes date; v_inicio date; v_valor int; k int; v_status public.status_recorrencia;
        v_atual date := date_trunc('month', current_date)::date;
begin
  for p in select * from seed_plano order by n loop
    select id into v_doador from seed_pessoas where n = p.n;
    v_inicio := (v_atual - (p.meses_atras_inicio || ' months')::interval)::date + (p.dia - 1);
    v_status := case when p.pausa_em is not null then 'pausada' when p.cancela_em is not null then 'cancelada' else 'ativa' end;
    insert into public.recorrencia (doador_id, valor_centavos, frequencia, status, meio, meio_ref, iniciada_em,
                                    proxima_cobranca, encerrada_em)
    values (v_doador, coalesce(p.altera_para, p.valor), p.freq, v_status, p.meio, p.meio_ref, v_inicio,
            case when v_status = 'ativa' then public.fn_proxima_data((v_atual + (p.dia - 1))::date, p.freq) end,
            case when v_status = 'cancelada' then (v_atual - (p.cancela_em || ' months')::interval)::date + p.dia end)
    returning id into v_id;
    insert into public.recorrencia_evento (recorrencia_id, tipo, valor_novo, freq_nova, em) values (v_id, 'criada', p.valor, p.freq, v_inicio);

    for k in 0 .. p.meses - 1 loop
      v_mes := (date_trunc('month', v_inicio) + (k || ' months')::interval)::date + (p.dia - 1);
      exit when v_mes > current_date;
      exit when p.cancela_em is not null and v_mes >= (v_atual - (p.cancela_em || ' months')::interval)::date;
      exit when p.pausa_em is not null and v_mes >= (v_atual - (p.pausa_em || ' months')::interval)::date;
      v_valor := case when p.altera_em is not null and v_mes >= (v_atual - (p.altera_em || ' months')::interval)::date then p.altera_para else p.valor end;
      perform public.fn_confirmar_doacao(v_doador, v_valor, 'recorrente', p.meio, v_id, v_mes::timestamptz + interval '9 hours');
    end loop;

    if p.altera_em is not null then
      insert into public.recorrencia_evento (recorrencia_id, tipo, valor_anterior, valor_novo, freq_anterior, freq_nova, em)
      values (v_id, 'alterada', p.valor, p.altera_para, p.freq, p.freq, (v_atual - (p.altera_em || ' months')::interval)::date + 2);
    end if;
    if p.pausa_em is not null then
      insert into public.recorrencia_evento (recorrencia_id, tipo, em) values (v_id, 'pausada', (v_atual - (p.pausa_em || ' months')::interval)::date + 1);
    end if;
    if p.cancela_em is not null then
      insert into public.recorrencia_evento (recorrencia_id, tipo, em) values (v_id, 'cancelada', (v_atual - (p.cancela_em || ' months')::interval)::date + 1);
    end if;
  end loop;

  for u in select * from seed_unicas loop
    select id into v_doador from seed_pessoas where n = u.n;
    v_mes := (v_atual - (u.meses_atras || ' months')::interval)::date + (u.dia - 1);
    if v_mes > current_date then v_mes := current_date; end if;
    perform public.fn_confirmar_doacao(v_doador, u.valor, 'unica', 'pix', null, v_mes::timestamptz + interval '14 hours');
  end loop;
end $$;

-- Recalcula marcos de todos (a trigger já fez, mas garante ordem determinística)
select public.fn_avaliar_marcos(id) from public.doador where papel = 'doador';
select public.fn_avaliar_marcos_embaixador(id) from public.embaixador;

-- Compartilhamentos (Renata e Eduardo). Certificados nascem sozinhos a cada conquista (trigger).
insert into public.compartilhamento (doador_id, conteudo, rede, em) values
  ('d0000000-0000-4000-8000-000000000003', 'convite', 'whatsapp', now() - interval '10 months'),
  ('d0000000-0000-4000-8000-000000000003', 'convite', 'linkedin', now() - interval '9 months'),
  ('d0000000-0000-4000-8000-000000000001', 'conquista', 'linkedin', now() - interval '2 months');

-- ------------------------------------------------------------
-- 5. Metas
-- ------------------------------------------------------------
insert into public.meta (tipo, rotulo, alvo, periodo_inicio, periodo_fim) values
  ('anual', 'Meta anual de sustentação', 1640000, date_trunc('year', current_date)::date, (date_trunc('year', current_date) + interval '1 year - 1 day')::date);
insert into public.meta (tipo, rotulo, alvo, embaixador_id, periodo_inicio, periodo_fim) values
  ('rede', 'Meta da rede de Renata', 25, 'e0000000-0000-4000-8000-000000000001', (current_date - interval '11 months')::date, (current_date + interval '1 month')::date);

-- ------------------------------------------------------------
-- 6. Indicadores agregados: 3 programas × 14 meses × 4 tipos (Vivência: sem indicador)
-- ------------------------------------------------------------
do $$
declare pr record; m int; v_mes date; v_atual date := date_trunc('month', current_date)::date;
        v_criancas numeric; v_horas numeric; v_freq numeric; v_ativ numeric; v_coord uuid := 'd0000000-0000-4000-8000-000000000000';
begin
  for pr in select id, codigo from public.programa where codigo in ('lab_sonhos','reforco','primeira_infancia') loop
    for m in 0..13 loop
      v_mes := (v_atual - (m || ' months')::interval)::date;
      case pr.codigo
        when 'lab_sonhos' then v_criancas := 54 + ((13 - m) / 3); v_horas := 20 + ((13 - m) % 3) * 2;  v_freq := 84 + ((13 - m) % 5); v_ativ := 4 + ((13 - m) % 2);
        when 'reforco'    then v_criancas := 38 + ((13 - m) / 6); v_horas := 160 + ((13 - m) % 4) * 4; v_freq := 86 + ((13 - m) % 4); v_ativ := 40 + ((13 - m) % 3) * 2;
        else                   v_criancas := 18 + ((13 - m) / 7); v_horas := 40 + ((13 - m) % 3) * 4;  v_freq := 88 + ((13 - m) % 3); v_ativ := 8 + ((13 - m) % 2);
      end case;
      insert into public.indicador (programa_id, periodo, tipo, valor, publico, atualizado_por) values
        (pr.id, v_mes, 'criancas_atendidas',    v_criancas, true, v_coord),
        (pr.id, v_mes, 'horas_atividade',       v_horas,    true, v_coord),
        (pr.id, v_mes, 'frequencia_media',      v_freq,     true, v_coord),
        (pr.id, v_mes, 'atividades_realizadas', v_ativ,     true, v_coord);
    end loop;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 7. Publicações: as 6 do protótipo + 12 anteriores
-- ------------------------------------------------------------
with pr as (select codigo, id from public.programa), coord as (select 'd0000000-0000-4000-8000-000000000000'::uuid as id)
insert into public.publicacao (programa_id, imagem_id, titulo, texto, cadencia, metrica_rotulo, metrica_valor, status, publico, publicada_em, criado_por)
select pr.id, i.img, t.titulo, t.texto, t.cadencia::public.cadencia_publicacao, t.metrica, t.mv, 'publicada', t.publico, now() - t.atras, coord.id
from (values
  ('lab_sonhos', 1, 'Dia de Arte', E'No Dia de Arte a proposta é simples: material sobre a mesa, tempo sem pressa e ninguém dizendo o que desenhar. Saíram 38 trabalhos e três histórias que a turma quer transformar em livro. Obrigado a quem sustenta esses sábados.\n#InstitutoSocialEbenézer  #LaboratórioDeSonhos', 'diaria', '+36 horas de atividade', 36, true, interval '6 days'),
  ('reforco', 2, 'Reforço de leitura e escrita', E'Turma da tarde, quatro disciplinas por semana e um combinado: ninguém avança sozinho. Ontem o exercício era reescrever o final de um conto — cada mesa terminou com uma versão diferente.\n#ReforçoEscolar  #EducaçãoQueContinua', 'diaria', '+24 horas de atividade', 24, true, interval '1 day'),
  ('primeira_infancia', 3, 'Estimulação sensorial e motora', E'Antes das letras vêm as mãos. Na Primeira Infância a semana foi de texturas, cores e encaixes — atividade que prepara coordenação, atenção e convívio para os programas seguintes.\n#PrimeiraInfância  #InstitutoSocialEbenézer', 'diaria', '20 crianças atendidas', 20, true, interval '2 days'),
  ('reforco', 5, 'Roda de conversa — projeto de vida', E'Projeto de vida é uma das quatro disciplinas do reforço, e a roda é onde ela acontece. A pergunta desta semana foi "o que você quer aprender a fazer?". Anotamos todas as respostas: elas orientam as visitas do próximo ciclo.\n#ProjetoDeVida  #RodaDeConversa', 'diaria', '3 encontros na semana', 3, false, interval '3 days'),
  ('lab_sonhos', 6, 'Recreação orientada no pátio', E'Fechamos a semana no pátio, com jogos cooperativos conduzidos pelos voluntários. É a atividade de maior presença do mês e a que melhor mistura as turmas dos quatro programas.\n#RecreaçãoOrientada  #Voluntariado', 'semanal', '68 crianças participaram', 68, true, interval '6 days'),
  ('lab_sonhos', 1, 'Mostra de trabalhos da oficina', E'Ao fim de cada ciclo de oficinas o que foi produzido vira exposição no corredor da sede. Foram 38 trabalhos, escolhidos pelas próprias crianças, e as famílias foram convidadas a visitar.\n#MostraDeTrabalhos  #InstitutoSocialEbenézer', 'semanal', '38 trabalhos expostos', 38, false, interval '6 days 4 hours'),
  ('lab_sonhos', 6, 'Balanço do mês nos programas', 'Fechamos o mês com 112 horas de atividade e 89% de frequência média. O boletim completo está disponível para download.', 'mensal', '112 horas no mês', 112, true, interval '26 days'),
  ('reforco', 2, 'Semana de avaliação diagnóstica', 'A avaliação diagnóstica orienta a divisão dos grupos de estudo do trimestre. Nenhum resultado individual é publicado — o que compartilhamos é a média da turma.', 'semanal', '40 crianças atendidas', 40, true, interval '34 days'),
  ('primeira_infancia', 3, 'Cantinho da leitura', 'Livros de pano, almofadas e meia hora por dia. A rotina de leitura começa antes da alfabetização.', 'diaria', '20 crianças atendidas', 20, true, interval '41 days'),
  ('lab_sonhos', 5, 'Visita de uma engenheira civil', 'Uma profissional do território conversou com a turma sobre o caminho até a profissão. Três crianças mudaram de aspiração depois da conversa — e isso é o objetivo.', 'semanal', '52 crianças participaram', 52, true, interval '48 days'),
  ('reforco', 2, 'Oficina de matemática com jogos', 'Frações com peças de encaixe e tabuada com dominó. Quando o exercício vira jogo, a frequência sobe.', 'diaria', '+20 horas de atividade', 20, true, interval '55 days'),
  ('lab_sonhos', 6, 'Balanço do mês nos programas', 'Mês de 108 horas de atividade e 87% de frequência média. Boletim disponível.', 'mensal', '108 horas no mês', 108, true, interval '57 days'),
  ('primeira_infancia', 3, 'Música e movimento', 'Ritmo, corpo e atenção. A atividade mais esperada da semana pelas crianças de 3 a 5 anos.', 'diaria', '18 crianças atendidas', 18, true, interval '63 days'),
  ('lab_sonhos', 1, 'Oficina de teatro', 'Dramatização de histórias escritas pela própria turma no mês anterior.', 'semanal', '48 crianças participaram', 48, true, interval '70 days'),
  ('reforco', 5, 'Roda de conversa — combinados', 'Os combinados de convivência do semestre foram construídos pela turma e fixados na parede da sala.', 'semanal', '2 encontros na semana', 2, true, interval '77 days'),
  ('lab_sonhos', 6, 'Balanço do mês nos programas', 'Mês de 104 horas de atividade e 88% de frequência média.', 'mensal', '104 horas no mês', 104, true, interval '88 days'),
  ('reforco', 2, 'Inglês com música', 'Vocabulário a partir de canções escolhidas pela turma. Aula com maior participação do mês.', 'diaria', '+16 horas de atividade', 16, true, interval '95 days'),
  ('primeira_infancia', 3, 'Horta em garrafas', 'Cada criança plantou uma muda em garrafa reciclada e acompanha o crescimento na entrada da sede.', 'semanal', '20 crianças atendidas', 20, true, interval '102 days')
) as t(prog, img_n, titulo, texto, cadencia, metrica, mv, publico, atras)
join pr on pr.codigo = t.prog
join (select generate_series(1,6) as n, ('a0000000-0000-4000-8000-00000000000' || generate_series(1,6))::uuid as img) i on i.n = t.img_n
cross join coord;

drop table seed_pessoas; drop table seed_plano; drop table seed_unicas;
