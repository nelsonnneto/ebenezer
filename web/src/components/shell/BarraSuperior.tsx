import Link from 'next/link';
import { Logo } from './Logo';
import { BotaoLink } from '@/components/ui';
import { iniciais, primeiroNome } from '@/lib/formato';

const NAV = [
  { href: '/', rotulo: 'Home', secao: 'home' },
  { href: '/atividades', rotulo: 'Atividades', secao: 'atividades' },
  { href: '/jornada', rotulo: 'Jornada', secao: 'jornada' },
  { href: '/mobilizar', rotulo: 'Mobilizar', secao: 'mobilizar' },
] as const;
export type Secao = (typeof NAV)[number]['secao'] | null;

export function BarraSuperior({ nome, ativa }: { nome: string; ativa: Secao }) {
  return (
    <header className="bg-surface border-b border-border">
      <div className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-8">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={ativa === n.secao ? 'page' : undefined}
              className={`py-3 text-[15px] leading-5 border-b-2 ${ativa === n.secao ? 'border-ink text-ink font-semibold' : 'border-transparent text-ink-2 hover:text-ink'}`}>
              {n.rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <form action="/auth/sair" method="post" className="flex items-center gap-3">
            <span className="text-[15px] text-ink-2">Olá, {primeiroNome(nome)}</span>
            <button title="Sair da conta" aria-label="Sair da conta"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-action text-[13px] font-bold text-on-action hover:bg-fill-4">
              {iniciais(nome)}
            </button>
          </form>
          <BotaoLink href="/doar" className="h-12">Doar agora</BotaoLink>
        </div>
      </div>
    </header>
  );
}
