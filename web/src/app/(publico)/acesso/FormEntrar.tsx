'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { entrar, type EstadoForm } from '../acoes';
import { Aviso, Botao } from '@/components/ui';

export function FormEntrar({ volta }: { volta?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(entrar, undefined);
  return (
    <form action={acao} className="mt-8 flex flex-col gap-5" noValidate>
      <input type="hidden" name="volta" value={volta ?? '/'} />
      <button type="button" disabled title="Login com Google em configuração"
        className="flex h-[52px] items-center justify-center gap-3 rounded-md border border-border bg-surface text-[15px] font-semibold text-ink opacity-60">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>
        Continuar com Google <span className="text-legenda font-normal text-ink-3">(em configuração)</span>
      </button>
      <div className="flex items-center gap-4 text-pequeno text-ink-3"><span className="h-px flex-1 bg-border-soft" />ou entre com e-mail<span className="h-px flex-1 bg-border-soft" /></div>
      <label className="flex flex-col gap-2">
        <span className="text-sub">E-mail</span>
        <input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com.br"
          className="h-[54px] rounded-md border border-border bg-surface px-4 text-corpo placeholder:text-ink-3" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sub">Senha</span>
        <input name="senha" type="password" autoComplete="current-password" required
          className="h-[54px] rounded-md border border-border bg-surface px-4 text-corpo" />
      </label>
      <Link href="/recuperar-senha" className="-mt-1 self-end text-pequeno text-ink-2 hover:text-ink">Esqueceu sua senha?</Link>
      {estado?.erro && <Aviso>{estado.erro}</Aviso>}
      <Botao type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Botao>
    </form>
  );
}
