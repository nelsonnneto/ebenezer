'use client';
import { useState } from 'react';

/** Botão que copia um texto para a área de transferência e confirma a ação por 2 s. */
export function Copiar({ texto, rotulo = 'Copiar', className = '' }: { texto: string; rotulo?: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={className} aria-live="polite"
      onClick={async () => { await navigator.clipboard?.writeText(texto).catch(() => {}); setOk(true); setTimeout(() => setOk(false), 2000); }}>
      {ok ? 'Copiado ✓' : rotulo}
    </button>
  );
}
