'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Frequencia } from '@/lib/tipos';

// Ações de contribuição: cada uma chama uma única RPC. Validação de regra é do banco;
// aqui só se converte o formulário e se traduz o erro para o doador.

export type Estado = { erro?: string } | undefined;

const MENSAGENS: Record<string, string> = {
  '23505': 'Você já tem uma recorrência ativa. Ajuste o valor em Gerenciar Recorrência.',
  '23514': 'O valor mensal precisa estar entre R$ 25 e R$ 500.',
  P0002: 'Não encontramos uma recorrência ativa para esta ação.',
  '22023': 'A pausa pode ser de 1 a 3 meses.',
};
const traduz = (e: { code?: string; message: string }) => MENSAGENS[e.code ?? ''] ?? 'Não foi possível concluir agora. Tente novamente em instantes.';

/** "1.234,56" | "150" | "R$ 150,00" → centavos */
function centavosDe(texto: string) {
  const limpo = texto.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export async function iniciarRecorrencia(_: Estado, form: FormData): Promise<Estado> {
  const centavos = Number(form.get('centavos'));
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_iniciar_recorrencia', { p_valor: centavos, p_freq: 'mensal', p_meio: 'simulado' });
  if (error) {
    if (error.code === '23505') redirect(`/recorrencia?valor=${centavos}`);
    return { erro: traduz(error) };
  }
  revalidatePath('/', 'layout');
  redirect('/doar/confirmada?tipo=recorrente');
}

export async function doarUnica(_: Estado, form: FormData): Promise<Estado> {
  const centavos = centavosDe(String(form.get('valor') ?? ''));
  if (!Number.isFinite(centavos) || centavos < 500) return { erro: 'Informe um valor a partir de R$ 5,00.' };
  if (centavos > 10_000_000) return { erro: 'Para valores acima de R$ 100.000, fale com a coordenação.' };
  const sb = await supabaseServidor();
  const { data, error } = await sb.rpc('fn_doar_unica', { p_valor: centavos, p_meio: 'simulado' });
  if (error) return { erro: traduz(error) };
  revalidatePath('/', 'layout');
  redirect(`/doar/confirmada?d=${(data as { id: string }).id}`);
}

export async function alterarRecorrencia(_: Estado, form: FormData): Promise<Estado> {
  const centavos = Number(form.get('centavos'));
  const freq = String(form.get('frequencia')) as Frequencia;
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_alterar_recorrencia', { p_valor: centavos, p_freq: freq });
  if (error) return { erro: traduz(error) };
  revalidatePath('/', 'layout');
  redirect('/recorrencia?ok=alterada');
}

export async function pausarRecorrencia(form: FormData) {
  const meses = Number(form.get('meses')) || null;
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_pausar_recorrencia', { p_meses: meses });
  if (error) redirect(`/recorrencia?erro=${encodeURIComponent(traduz(error))}`);
  revalidatePath('/', 'layout');
  redirect('/recorrencia?ok=pausada');
}

export async function retomarRecorrencia() {
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_retomar_recorrencia');
  if (error) redirect(`/recorrencia?erro=${encodeURIComponent(traduz(error))}`);
  revalidatePath('/', 'layout');
  redirect('/recorrencia?ok=retomada');
}

export async function cancelarRecorrencia() {
  const sb = await supabaseServidor();
  const { error } = await sb.rpc('fn_cancelar_recorrencia');
  if (error) redirect(`/recorrencia?erro=${encodeURIComponent(traduz(error))}`);
  revalidatePath('/', 'layout');
  redirect('/recorrencia?ok=cancelada');
}
