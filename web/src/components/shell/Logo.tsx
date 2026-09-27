import Link from 'next/link';

export function Monograma({ tamanho = 30 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 30 30" aria-hidden>
      <rect width="30" height="30" rx="5" fill="var(--color-action)" />
      <path d="M8 15.5l4.6 4.6L22.5 9.8" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Ebenézer Conecta — início">
      <Monograma />
      <span className="text-[20px] leading-[26px] text-ink"><b className="font-bold">Ebenézer</b> Conecta</span>
    </Link>
  );
}
