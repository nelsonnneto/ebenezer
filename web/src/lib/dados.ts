import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServidor } from './supabase/server';
import type {
  Conquista, Continuidade, DoacoesMes, ItemHistorico, MarcoTrilha, MetaProgresso, PainelImpacto, Perfil, ProximoMarco, Publicacao, Recorrencia,
} from './tipos';

// Camada de leitura: só consultas a views e RPCs. Regras de negócio moram no banco.

function falhou(onde: string, error: { message: string } | null) {
  if (error) throw new Error(`Falha ao ler ${onde}: ${error.message}`);
}

/** Usuário logado + perfil. Redireciona para /acesso se a sessão caiu. Memoizado por requisição. */
export const sessao = cache(async () => {
  const sb = await supabaseServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/acesso');
  const { data, error } = await sb.from('doador').select('id,nome_exibicao,papel').eq('id', user.id).single();
  falhou('perfil', error);
  return { sb, perfil: data as Perfil };
});

export async function continuidade() {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_continuidade').select('*').eq('doador_id', perfil.id).single();
  falhou('continuidade', error);
  return data as Continuidade;
}

export async function recorrenciaAtual() {
  const { sb } = await sessao();
  const { data, error } = await sb.rpc('fn_recorrencia_ativa');
  falhou('recorrência', error);
  return (data && (data as Recorrencia).id ? data : null) as Recorrencia | null;
}

export async function trilha() {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_trilha').select('*').eq('doador_id', perfil.id).eq('trilha', 'doador').order('ordem');
  falhou('trilha', error);
  return (data ?? []) as MarcoTrilha[];
}

export async function conquistas() {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_conquistas').select('*').eq('doador_id', perfil.id).order('alcancada_em', { ascending: false });
  falhou('conquistas', error);
  return (data ?? []) as Conquista[];
}

export async function proximoMarco() {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_proximo_marco').select('*').eq('doador_id', perfil.id).maybeSingle();
  falhou('próximo marco', error);
  return data as ProximoMarco | null;
}

export async function historico(limite = 8) {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_historico').select('*').eq('doador_id', perfil.id).eq('status', 'confirmada')
    .order('realizada_em', { ascending: false }).limit(limite);
  falhou('histórico', error);
  return (data ?? []) as ItemHistorico[];
}

export async function doacao(id: string) {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_historico').select('*').eq('doador_id', perfil.id).eq('id', id).maybeSingle();
  falhou('doação', error);
  return data as ItemHistorico | null;
}

export async function painelImpacto(filtro: { ano?: number; programa?: string; de?: string; ate?: string }) {
  const { sb } = await sessao();
  const { data, error } = await sb.rpc('fn_painel_impacto', {
    p_ano: filtro.ano ?? null, p_programa: filtro.programa ?? null, p_de: filtro.de ?? null, p_ate: filtro.ate ?? null,
  });
  falhou('painel de impacto', error);
  return data as PainelImpacto;
}

export async function doacoesPorMes(ano: number) {
  const { sb } = await sessao();
  const { data, error } = await sb.from('v_doacoes_mes').select('*').order('periodo');
  falhou('doações por mês', error);
  return ((data ?? []) as DoacoesMes[]).filter((d) => d.periodo.startsWith(String(ano)));
}

export async function metaAnual() {
  const { sb } = await sessao();
  const { data, error } = await sb.from('v_meta_progresso').select('*').eq('tipo', 'anual').order('periodo_inicio', { ascending: false }).limit(1).maybeSingle();
  falhou('meta anual', error);
  return data as MetaProgresso | null;
}

export async function feed(limite = 6, programa?: string) {
  const { sb } = await sessao();
  let q = sb.from('v_feed').select('*').order('publicada_em', { ascending: false }).limit(limite);
  if (programa) q = q.eq('programa_codigo', programa);
  const { data, error } = await q;
  falhou('feed', error);
  return (data ?? []) as Publicacao[];
}

export async function programas() {
  const { sb } = await sessao();
  const { data, error } = await sb.from('programa').select('codigo,nome').order('ordem');
  falhou('programas', error);
  return (data ?? []) as { codigo: string; nome: string }[];
}

export async function embaixadorDoUsuario() {
  const { sb, perfil } = await sessao();
  const { data } = await sb.from('embaixador').select('id,slug,ativo').eq('doador_id', perfil.id).maybeSingle();
  return data as { id: string; slug: string; ativo: boolean } | null;
}

/** URL pública de um objeto do Storage ("midia/01.jpg" → http://…/storage/v1/object/public/midia/01.jpg) */
export function urlStorage(caminho: string | null | undefined) {
  return caminho ? `${supabaseUrl()}/storage/v1/object/public/${caminho}` : null;
}

export async function eventosRecorrencia(recorrenciaId: string, limite = 5) {
  const { sb } = await sessao();
  const { data, error } = await sb.from('recorrencia_evento').select('id,tipo,valor_anterior,valor_novo,freq_anterior,freq_nova,em')
    .eq('recorrencia_id', recorrenciaId).order('em', { ascending: false }).limit(limite);
  falhou('eventos da recorrência', error);
  return (data ?? []) as { id: string; tipo: string; valor_anterior: number | null; valor_novo: number | null; freq_anterior: string | null; freq_nova: string | null; em: string }[];
}

// ---------- Bloco 3: feed, rede do embaixador ----------
import type { Cadencia, Embaixador, Material, OrigemCanal, RedeEmbaixador, RedeMes, ResumoFeed } from './tipos';
import { siteUrl, supabaseUrl } from './ambiente';

export async function feedFiltrado(f: { cadencia?: Cadencia; programa?: string; de?: string; limite?: number }) {
  const { sb } = await sessao();
  let q = sb.from('v_feed').select('*').order('publicada_em', { ascending: false }).limit(f.limite ?? 12);
  if (f.cadencia) q = q.eq('cadencia', f.cadencia);
  if (f.programa) q = q.eq('programa_codigo', f.programa);
  if (f.de) q = q.gte('publicada_em', f.de);
  const { data, error } = await q;
  falhou('feed', error);
  return (data ?? []) as Publicacao[];
}

export async function resumoFeed(de: string, ate: string) {
  const { sb } = await sessao();
  const { data, error } = await sb.rpc('fn_resumo_feed', { p_de: de, p_ate: ate });
  falhou('resumo do feed', error);
  return data as ResumoFeed;
}

export async function meuEmbaixador() {
  return (await embaixadorDoUsuario()) as Embaixador | null;
}

export async function painelRede() {
  const { sb } = await sessao();
  const [rede, canais, meses, materiais, metas] = await Promise.all([
    sb.from('v_rede_embaixador').select('*').maybeSingle(),
    sb.from('v_rede_origem_canal').select('canal,acessos,doadores').order('doadores', { ascending: false }).order('acessos', { ascending: false }),
    sb.from('v_rede_mes').select('mes,novos_doadores').order('mes'),
    sb.from('v_materiais_embaixador').select('*').order('ordem'),
    sb.from('v_meta_progresso').select('*').eq('tipo', 'rede').limit(1).maybeSingle(),
  ]);
  for (const [nome, r] of [['rede', rede], ['canais', canais], ['meses', meses], ['materiais', materiais], ['meta', metas]] as const) falhou(nome, r.error);
  return {
    rede: rede.data as RedeEmbaixador | null,
    canais: (canais.data ?? []) as OrigemCanal[],
    meses: (meses.data ?? []) as RedeMes[],
    // O banco grava o domínio definitivo; na demonstração o link aponta para o endereço em uso.
    materiais: ((materiais.data ?? []) as Material[]).map((m) => ({
      ...m, texto_pronto: m.texto_pronto?.replaceAll('ebenezerconecta.org.br/r/', `${SITE.replace(/^https?:\/\//, '')}/r/`) ?? m.texto_pronto,
    })),
    meta: metas.data as MetaProgresso | null,
  };
}

export async function trilhaEmbaixador() {
  const { sb, perfil } = await sessao();
  const { data, error } = await sb.from('v_trilha').select('*').eq('doador_id', perfil.id).eq('trilha', 'embaixador').order('ordem');
  falhou('trilha do embaixador', error);
  return (data ?? []) as MarcoTrilha[];
}

/** Endereço público do site, para links compartilháveis que funcionem de verdade. */
export const SITE = siteUrl();
export const linkConvite = (slug: string | null, canal?: string) =>
  `${SITE}/r/${slug ?? 'instituto'}${canal ? `?c=${canal}` : ''}`;
