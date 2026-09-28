'use client';
import { useActionState } from 'react';
import { cadastrar, type EstadoForm } from '../acoes';
import { Aviso, Botao } from '@/components/ui';

const CAMPO = 'h-[54px] rounded-md border border-border bg-surface px-4 text-corpo placeholder:text-ink-3';

export function FormCadastro() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(cadastrar, undefined);
  if (estado?.ok) return <div className="mt-8"><Aviso tom="ok">{estado.ok}</Aviso></div>;
  return (
    <form action={acao} className="mt-8 flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-sub">Como quer ser chamado</span>
        <input name="nome" autoComplete="name" required maxLength={80} placeholder="Nome e sobrenome" className={CAMPO} />
        <span className="text-legenda text-ink-3">Aparece só para você e no seu certificado.</span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sub">E-mail</span>
        <input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com.br" className={CAMPO} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sub">Senha</span>
        <input name="senha" type="password" autoComplete="new-password" required minLength={8} className={CAMPO} />
        <span className="text-legenda text-ink-3">Mínimo de 8 caracteres.</span>
      </label>
      <label className="flex items-start gap-3 text-pequeno text-ink-2">
        <input type="checkbox" name="comunicacao" className="mt-0.5 h-4 w-4 accent-fill-4" />
        Quero receber o boletim mensal e novidades dos programas por e-mail. Posso cancelar quando quiser.
      </label>
      <label className="flex items-start gap-3 text-pequeno text-ink-2">
        <input type="checkbox" name="privacidade" required className="mt-0.5 h-4 w-4 accent-fill-4" />
        Li a Política de Privacidade. Meus dados são tratados conforme a LGPD e não são compartilhados com terceiros.
      </label>
      {estado?.erro && <Aviso>{estado.erro}</Aviso>}
      <Botao type="submit" disabled={enviando}>{enviando ? 'Criando conta…' : 'Criar conta e escolher como apoiar'}</Botao>
    </form>
  );
}
