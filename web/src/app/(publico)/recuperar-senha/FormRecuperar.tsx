'use client';
import { useActionState } from 'react';
import { recuperarSenha, type EstadoForm } from '../acoes';
import { Aviso, Botao } from '@/components/ui';

export function FormRecuperar() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(recuperarSenha, undefined);
  return (
    <form action={acao} className="mt-8 flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sub">E-mail</span>
        <input name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com.br"
          className="h-[54px] rounded-md border border-border bg-surface px-4 text-corpo placeholder:text-ink-3" />
      </label>
      {estado?.erro && <Aviso>{estado.erro}</Aviso>}
      <Botao type="submit" disabled={enviando}>Enviar link de recuperação</Botao>
    </form>
  );
}
