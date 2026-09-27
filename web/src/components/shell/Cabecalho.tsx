import Link from 'next/link';
import type { ReactNode } from 'react';

/** Cabeçalho de página: link de volta, sobretítulo, título e texto de apoio — faixa clara do Figma. */
export function Cabecalho({ volta, rotulo, titulo, texto, children }: {
  volta?: { href: string; rotulo: string }; rotulo: string; titulo: ReactNode; texto?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="border-b border-border-soft bg-surface-muted">
      <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-12">
        {volta && <Link href={volta.href} className="text-pequeno text-ink-2 hover:text-ink">←&nbsp;&nbsp;&nbsp;{volta.rotulo}</Link>}
        <p className={`text-caps text-ink-2 ${volta ? 'mt-6' : ''}`}>{rotulo}</p>
        <h1 className="text-display mt-3">{titulo}</h1>
        {texto && <p className="text-corpo mt-3 max-w-[900px] text-ink-2">{texto}</p>}
        {children}
      </div>
    </div>
  );
}

export function Conteudo({ children, estreito = false }: { children: ReactNode; estreito?: boolean }) {
  return <div className={`mx-auto px-6 py-10 ${estreito ? 'max-w-[928px]' : 'max-w-[1200px]'}`}>{children}</div>;
}
