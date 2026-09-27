'use client';
import { useRouter, useSearchParams } from 'next/navigation';

/** Filtros do Dashboard de Impacto: programa e ano. Só altera a URL; o banco agrega. */
export function FiltroPainel({ programas, anos }: { programas: { codigo: string; nome: string }[]; anos: number[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const muda = (chave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(chave, valor); else p.delete(chave);
    router.push(`?${p.toString()}`, { scroll: false });
  };
  const estilo = 'h-9 rounded-md border px-3 text-pequeno text-ink';
  return (
    <div className="flex gap-2">
      <select aria-label="Programa" value={params.get('programa') ?? ''} onChange={(e) => muda('programa', e.target.value)}
        className={`${estilo} ${params.get('programa') ? 'border-accent bg-selected' : 'border-accent bg-selected'}`}>
        <option value="">Todos os programas</option>
        {programas.map((p) => <option key={p.codigo} value={p.codigo}>{p.nome}</option>)}
      </select>
      <select aria-label="Ano" value={params.get('ano') ?? String(anos[0])} onChange={(e) => muda('ano', e.target.value)} className={`${estilo} border-border bg-surface`}>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}
