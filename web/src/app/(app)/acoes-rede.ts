'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Rede } from '@/lib/tipos';

export async function tornarEmbaixador() {
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_tornar_embaixador');
  if (error) redirect(`/mobilizar?erro=${encodeURIComponent(error.code === 'P0001' ? 'A Central do Embaixador é liberada após a sua primeira contribuição.' : 'Não foi possível ativar o link agora.')}`);
  revalidatePath('/', 'layout');
  redirect('/mobilizar?ok=ativado');
}

/** Registra o compartilhamento (alimenta o marco Voz da Causa). O redirecionamento para a rede é feito no navegador. */
export async function registrarCompartilhamento(conteudo: 'certificado' | 'conquista' | 'convite', rede: Rede) {
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_registrar_compartilhamento', { p_conteudo: conteudo, p_rede: rede });
  if (!error) revalidatePath('/mobilizar');
  return { ok: !error };
}
