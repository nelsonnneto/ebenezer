'use server';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { vincularOrigemDoCookie } from '@/lib/publico';

export type EstadoForm = { erro?: string; ok?: string } | undefined;

/** Cadastro: devolve os valores digitados (exceto a senha) e um erro por campo, para o formulário não voltar vazio. */
export type EstadoCadastro = {
  erro?: string; ok?: string;
  erros?: Partial<Record<'nome' | 'email' | 'senha' | 'privacidade', string>>;
  valores?: { nome: string; email: string; comunicacao: boolean; privacidade: boolean };
} | undefined;

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
  await vincularOrigemDoCookie(sb);   // chegou por um convite e já tinha conta
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

export async function cadastrar(_: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const nome = String(form.get('nome') ?? '').trim().replace(/\s+/g, ' ');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const senha = String(form.get('senha') ?? '');
  const comunicacao = form.get('comunicacao') === 'on';
  const privacidade = form.get('privacidade') === 'on';
  const valores = { nome, email, comunicacao, privacidade };

  // Valida tudo de uma vez (achado A01 dos testes com usuários): uma única tentativa mostra todos os ajustes.
  const erros: NonNullable<EstadoCadastro>['erros'] = {};
  if (nome.length < 2 || nome.length > 80) erros.nome = 'Informe como você quer ser chamado (2 a 80 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = 'Informe um e-mail válido.';
  if (senha.length < 8) erros.senha = 'A senha precisa ter pelo menos 8 caracteres.';
  if (!privacidade) erros.privacidade = 'Para criar a conta, confirme que leu a Política de Privacidade.';
  if (Object.keys(erros).length) return { erros, valores, erro: 'Revise os campos indicados. O que você já digitou foi mantido.' };

  const sb = await supabaseServidor();
  const { data, error } = await sb.auth.signUp({ email, password: senha, options: { data: { nome } } });
  if (error) {
    return { valores, erro: /already|registered|exists/i.test(error.message)
      ? 'Já existe uma conta com este e-mail. Entre com sua senha ou recupere o acesso.'
      : 'Não foi possível criar a conta agora. Tente de novo em instantes.' };
  }
  // Projeto hospedado com confirmação de e-mail ativa: não há sessão até o clique no link.
  if (!data.session) return { ok: `Enviamos um link de confirmação para ${email}. Depois de confirmar, entre com sua senha.` };

  await vincularOrigemDoCookie(sb);
  if (comunicacao) await sb.rpc('fn_atualizar_consentimento', { p_comunicacao: true });
  redirect('/doar?bemvindo=1');
}
