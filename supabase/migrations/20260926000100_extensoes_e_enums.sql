-- ============================================================
-- EbenézerConecta · 0001 · Extensões e tipos enumerados
-- ============================================================
create extension if not exists "pgcrypto";

-- Contribuição
create type public.tipo_doacao            as enum ('unica', 'recorrente');
create type public.meio_pagamento         as enum ('pix', 'cartao', 'simulado');
create type public.status_doacao          as enum ('registrada', 'confirmada', 'estornada');
create type public.frequencia_recorrencia as enum ('semanal', 'quinzenal', 'mensal');
create type public.status_recorrencia     as enum ('ativa', 'pausada', 'cancelada');
create type public.tipo_evento_recorrencia as enum ('criada', 'alterada', 'pausada', 'retomada', 'cancelada');
create type public.canal_origem           as enum ('whatsapp', 'linkedin', 'instagram', 'x', 'facebook', 'evento', 'direto');

-- Reconhecimento
create type public.trilha_marco             as enum ('doador', 'embaixador');
create type public.conteudo_compartilhamento as enum ('certificado', 'conquista', 'convite');

-- Institucional
create type public.tipo_indicador      as enum ('criancas_atendidas', 'horas_atividade', 'frequencia_media', 'atividades_realizadas');
create type public.cadencia_publicacao as enum ('diaria', 'semanal', 'mensal');
create type public.status_publicacao   as enum ('rascunho', 'publicada', 'arquivada');
create type public.tipo_material       as enum ('card', 'texto', 'post', 'assinatura');
create type public.tipo_meta           as enum ('anual', 'rede');

-- Acesso
create type public.papel_usuario as enum ('doador', 'coordenacao');
