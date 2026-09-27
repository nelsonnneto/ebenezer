'use server';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

export type EstadoForm = { erro?: string; ok?: string } | undefined;

function destinoSeguro(volta: FormDataEntryValue | null) {
  const v = typeof volta === 'string' ? volta : '';
  return v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  if (!email || !senha) return { erro: 'Informe e-mail e senha.' };
  const sb = await supabaseServidor();
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: 'E-mail ou senha não conferem. Verifique e tente de novo.' };
  redirect(destinoSeguro(form.get('volta')));
}

export async function recuperarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = String(form.get('email') ?? '').trim();
  if (!email) return { erro: 'Informe o e-mail cadastrado.' };
  const sb = await supabaseServidor();
  await sb.auth.resetPasswordForEmail(email);
  // Resposta neutra: não revela se a conta existe (mesma decisão do protótipo).
  redirect(`/recuperar-senha?enviado=${encodeURIComponent(email)}`);
}
