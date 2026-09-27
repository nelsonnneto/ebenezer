import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Moldura } from '@/components/shell/Moldura';
import { BotaoLink, Cartao } from '@/components/ui';
import { doacao, historico, recorrenciaAtual } from '@/lib/dados';
import { MEIO, data, maiuscula, reais } from '@/lib/formato';
import { nomeDoPlano } from '@/lib/planos';

export const metadata: Metadata = { title: 'Doação confirmada' };

export default async function Confirmada({ searchParams }: { searchParams: Promise<{ d?: string; tipo?: string }> }) {
  const sp = await searchParams;
  const recorrente = sp.tipo === 'recorrente';
  const [rec, ultima] = recorrente ? await Promise.all([recorrenciaAtual(), historico(1)]) : [null, null];
  const unica = sp.d ? await doacao(sp.d) : null;
  const d = unica ?? ultima?.[0] ?? null;
  if (!d || (recorrente && !rec)) notFound();

  const itens = recorrente && rec
    ? [['Plano', nomeDoPlano(rec.valor_centavos)], ['Valor', `${reais(rec.valor_centavos)} / mês`], ['Próxima cobrança', data(rec.proxima_cobranca)], ['Meio', maiuscula(rec.meio_ref ?? MEIO[rec.meio]!)]]
    : [['Tipo', 'Doação única'], ['Valor', reais(d.valor_centavos)], ['Data', data(d.realizada_em)], ['Meio', MEIO[d.meio]]];

  return (
    <Moldura ativa={null}>
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <Cartao className="mx-auto flex max-w-[920px] flex-col items-center px-20 py-14 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-selected" aria-hidden>
            <svg width="34" height="34" viewBox="0 0 34 34"><path d="M6 18l7 7 15-15" fill="none" stroke="var(--color-fill-4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="text-display mt-6">Doação confirmada</h1>
          <p className="text-corpo mt-3 max-w-[640px] text-ink-2">
            {recorrente && rec
              ? `Sua contribuição recorrente de ${reais(rec.valor_centavos)} por mês foi registrada. A primeira cobrança ocorreu hoje e as seguintes acontecem no mesmo dia de cada mês.`
              : `Sua doação de ${reais(d.valor_centavos)} foi registrada. Obrigado por apoiar os programas do Instituto.`}
          </p>
          <dl className="mt-8 grid w-full grid-cols-4 gap-5 rounded-md bg-surface-muted px-6 py-5 text-left">
            {itens.map(([k, v]) => (
              <div key={k}><dt className="text-caps text-ink-3">{k}</dt><dd className="text-sub mt-1.5">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-8 flex gap-3">
            <BotaoLink href="/jornada">Ver minha jornada</BotaoLink>
            <BotaoLink href="/jornada#historico" variante="secundario">Ver comprovante</BotaoLink>
          </div>
          <p className="text-pequeno mt-6 max-w-[640px] text-ink-3">
            Recibo {d.recibo_numero}. {recorrente ? 'Você pode alterar o valor, a frequência ou pausar a contribuição a qualquer momento, sem justificativa.' : 'Quer tornar seu apoio contínuo? Uma recorrência a partir de R$ 25 por mês pode ser pausada ou cancelada quando quiser.'}
          </p>
        </Cartao>
      </div>
    </Moldura>
  );
}
