import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variante = 'primario' | 'secundario';
const BOTAO = 'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-botao transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-action text-on-action hover:bg-fill-4',
  secundario: 'bg-surface text-ink border border-border hover:bg-surface-muted',
};

export function Botao({ variante = 'primario', className = '', ...p }: ComponentProps<'button'> & { variante?: Variante }) {
  return <button className={`${BOTAO} ${VARIANTES[variante]} ${className}`} {...p} />;
}
export function BotaoLink({ variante = 'primario', className = '', ...p }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BOTAO} ${VARIANTES[variante]} ${className}`} {...p} />;
}

export function Cartao({ className = '', children, ...p }: ComponentProps<'section'>) {
  return <section className={`bg-surface border border-border rounded-lg ${className}`} {...p}>{children}</section>;
}

export function Rotulo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-caps text-ink-2 ${className}`}>{children}</p>;
}

export function Kpi({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-4">
      <p className="text-metrica text-ink">{valor}</p>
      <p className="text-pequeno text-ink-2 mt-2">{rotulo}</p>
    </div>
  );
}

export function Progresso({ valor, rotulo }: { valor: number; rotulo?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(valor * 100)));
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}
      className="h-2 w-full rounded-full bg-track overflow-hidden">
      <div className="h-full rounded-full bg-action" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Chip({ ativo, children, ...p }: ComponentProps<typeof Link> & { ativo?: boolean }) {
  return (
    <Link {...p} aria-current={ativo ? 'true' : undefined}
      className={`inline-flex items-center h-9 px-3 rounded-md border text-pequeno ${ativo ? 'bg-selected border-accent text-ink' : 'bg-surface border-border text-ink hover:bg-surface-muted'}`}>
      {children}
    </Link>
  );
}

export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'marca' }) {
  return <span className={`inline-flex items-center h-6 px-2 rounded-md text-legenda ${tom === 'marca' ? 'bg-selected text-fill-4' : 'bg-surface-muted text-ink-2 border border-border-soft'}`}>{children}</span>;
}

/** Nota de governança: explica ao doador o que o dado mostra e o que não mostra. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 items-start rounded-lg border border-dashed border-fill-2 bg-fill-1 px-4 py-3 text-legenda text-ink-2">
      <span aria-hidden className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-3 text-[10px] font-bold text-ink-3">i</span>
      <p>{children}</p>
    </div>
  );
}

export function LinkSeta({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-pequeno text-ink hover:text-action">{children}&nbsp;&nbsp;→</Link>;
}

export function Aviso({ tom = 'erro', children }: { tom?: 'erro' | 'ok'; children: ReactNode }) {
  return (
    <p role={tom === 'erro' ? 'alert' : 'status'}
      className={`rounded-md px-4 py-3 text-pequeno ${tom === 'erro' ? 'bg-[#fdecea] text-[#8a1c12] border border-[#f1b8b0]' : 'bg-selected text-fill-4 border border-fill-2'}`}>
      {children}
    </p>
  );
}

/** Imagem ilustrativa do Storage, com fundo neutro enquanto carrega. */
export function Foto({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-md bg-skeleton ${className}`}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" /> : null}
    </div>
  );
}
