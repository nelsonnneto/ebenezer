'use client';
import { useActionState } from 'react';
import { doarUnica, iniciarRecorrencia, type Estado } from '../acoes-contribuicao';
import { Aviso, Botao } from '@/components/ui';

export function BotaoPlano({ centavos, rotulo }: { centavos: number; rotulo: string }) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(iniciarRecorrencia, undefined);
  return (
    <form action={acao} className="mt-auto pt-5">
      <input type="hidden" name="centavos" value={centavos} />
      <Botao type="submit" disabled={enviando} className="h-11 px-4">{enviando ? 'Confirmando…' : rotulo}</Botao>
      {estado?.erro && <div className="mt-3"><Aviso>{estado.erro}</Aviso></div>}
    </form>
  );
}

export function FormDoacaoUnica() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(doarUnica, undefined);
  return (
    <form action={acao} className="mt-6 flex flex-col gap-3">
      <label className="flex items-center gap-4">
        <span className="text-pequeno text-ink-2">Valor da doação</span>
        <input name="valor" inputMode="decimal" placeholder="R$ 0,00" aria-describedby="ajuda-valor"
          className="h-11 w-[220px] rounded-md border border-border bg-surface px-3 text-corpo placeholder:text-ink-3" />
      </label>
      <p id="ajuda-valor" className="text-legenda text-ink-3">Valor definido por você, a partir de R$ 5,00. Sem recorrência.</p>
      {estado?.erro && <Aviso>{estado.erro}</Aviso>}
      <Botao type="submit" disabled={enviando} className="mt-2 self-start h-11">{enviando ? 'Confirmando…' : 'Doar valor único'}</Botao>
    </form>
  );
}
