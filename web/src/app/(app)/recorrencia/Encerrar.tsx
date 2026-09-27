'use client';
import { useState } from 'react';
import { cancelarRecorrencia } from '../acoes-contribuicao';

/** Cancelamento em dois passos, sem pedir justificativa (§7). */
export function Encerrar() {
  const [confirmando, setConfirmando] = useState(false);
  if (!confirmando) {
    return <button type="button" onClick={() => setConfirmando(true)} className="text-pequeno text-ink-2 underline underline-offset-4 hover:text-ink">Cancelar minha recorrência</button>;
  }
  return (
    <form action={cancelarRecorrencia} className="flex flex-wrap items-center gap-3">
      <span className="text-pequeno text-ink-2">Confirma o cancelamento? Suas conquistas e certificados permanecem.</span>
      <button className="h-9 rounded-md border border-border px-3 text-pequeno font-semibold">Sim, cancelar</button>
      <button type="button" onClick={() => setConfirmando(false)} className="text-pequeno text-ink-2">Manter</button>
    </form>
  );
}
