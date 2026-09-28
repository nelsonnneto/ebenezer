import 'server-only';
import { cookies } from 'next/headers';
import { supabaseServidor } from './supabase/server';
import type { MetaProgresso, PainelImpacto, Publicacao } from './tipos';

// Leituras da porta de entrada pública. Rodam com o papel anon (ou o do usuário, se houver sessão):
// a RLS entrega só indicadores e publicações marcados como públicos e a meta anual agregada.

export const COOKIE_ORIGEM = 'ec_origem';
export const CANAIS = ['whatsapp', 'linkedin', 'instagram', 'x', 'facebook', 'evento', 'direto'] as const;
export type Canal = (typeof CANAIS)[number];

export async function vitrine() {
  const sb = await supabaseServidor();
  const ano = new Date().getFullYear();
  const [impacto, programas, feed, meta, usuario] = await Promise.all([
    sb.rpc('fn_painel_impacto', { p_ano: ano }),
    sb.from('programa').select('codigo,nome,faixa_etaria,cadencia,descricao').order('ordem'),
    sb.from('v_feed').select('*').eq('publico', true).order('publicada_em', { ascending: false }).limit(3),
    sb.from('v_meta_progresso').select('*').eq('tipo', 'anual').lte('periodo_inicio', new Date().toISOString().slice(0, 10))
      .order('periodo_inicio', { ascending: false }).limit(1).maybeSingle(),
    sb.auth.getUser(),
  ]);
  for (const r of [impacto, programas, feed, meta]) if (r.error) throw new Error(`Falha na vitrine pública: ${r.error.message}`);
  return {
    impacto: impacto.data as PainelImpacto,
    programas: (programas.data ?? []) as { codigo: string; nome: string; faixa_etaria: string; cadencia: string; descricao: string | null }[],
    feed: (feed.data ?? []) as Publicacao[],
    meta: meta.data as MetaProgresso | null,
    logado: Boolean(usuario.data.user),
  };
}

/** Vincula ao doador recém-autenticado a origem gravada no cookie pelo link /r/<slug>. Idempotente no banco. */
export async function vincularOrigemDoCookie(sb: Awaited<ReturnType<typeof supabaseServidor>>) {
  const store = await cookies();
  const origem = store.get(COOKIE_ORIGEM)?.value;
  if (!origem || !/^[0-9a-f-]{36}$/i.test(origem)) return;
  await sb.rpc('fn_vincular_origem', { p_origem: origem });
  store.delete(COOKIE_ORIGEM);
}
