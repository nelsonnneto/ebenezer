'use client';
import { useActionState, useState } from 'react';
import { alterarRecorrencia, type Estado } from '../acoes-contribuicao';
import { Aviso, Botao, BotaoLink, Cartao } from '@/components/ui';
import { MARCAS_REGUA, PARADAS_VALOR } from '@/lib/planos';
import type { Frequencia } from '@/lib/tipos';

const FREQS: { v: Frequencia; r: string; porAno: number }[] = [
  { v: 'semanal', r: 'Semanal', porAno: 52 }, { v: 'quinzenal', r: 'Quinzenal', porAno: 26 }, { v: 'mensal', r: 'Mensal', porAno: 12 },
];
const brl = (reais: number) => `R$ ${reais.toLocaleString('pt-BR')}`;
const indiceMaisProximo = (reais: number) =>
  PARADAS_VALOR.reduce((melhor, v, i) => (Math.abs(v - reais) < Math.abs(PARADAS_VALOR[melhor]! - reais) ? i : melhor), 0);

/** Seletor de valor + frequência + resumo. Não calcula nada de negócio: só compõe o pedido para a RPC. */
export function Ajuste({ valorAtual, freqAtual, valorSugerido, meio, proxima, diaCobranca }: {
  valorAtual: number; freqAtual: Frequencia; valorSugerido?: number; meio: string; proxima: string; diaCobranca: string;
}) {
  const [indice, setIndice] = useState(indiceMaisProximo((valorSugerido ?? valorAtual) / 100));
  const [freq, setFreq] = useState<Frequencia>(freqAtual);
  const [estado, acao, enviando] = useActionState<Estado, FormData>(alterarRecorrencia, undefined);
  const reais = PARADAS_VALOR[indice]!;
  const pct = (indice / (PARADAS_VALOR.length - 1)) * 100;
  const mudou = reais * 100 !== valorAtual || freq !== freqAtual;
  const f = FREQS.find((x) => x.v === freq)!;

  return (
    <form action={acao} className="flex flex-col gap-6">
      <input type="hidden" name="centavos" value={reais * 100} />
      <input type="hidden" name="frequencia" value={freq} />

      <Cartao className="p-7">
        <h2 className="text-secao">Valor da contribuição</h2>
        <p className="text-pequeno mt-2 text-ink-2">Arraste o marcador para escolher quanto deseja contribuir a cada cobrança.</p>
        <div className="mt-6 flex items-baseline justify-between">
          <label htmlFor="valor" className="text-pequeno text-ink-2">Valor por contribuição</label>
          <output htmlFor="valor" className="text-metrica" aria-live="polite">{brl(reais)}</output>
        </div>
        <input id="valor" type="range" min={0} max={PARADAS_VALOR.length - 1} step={1} value={indice}
          onChange={(e) => setIndice(Number(e.target.value))} aria-valuetext={brl(reais)}
          className="slider-valor mt-5" style={{ ['--pct' as string]: `${pct}%` }} />
        <div className="relative mt-3 h-4 text-legenda text-ink-3">
          {MARCAS_REGUA.map((m) => {
            const i = PARADAS_VALOR.indexOf(m);
            const borda = i === 0 ? '' : i === PARADAS_VALOR.length - 1 ? '-translate-x-full' : '-translate-x-1/2';
            return (
              <span key={m} className={`absolute whitespace-nowrap ${borda} ${m === reais ? 'font-bold text-ink' : ''}`} style={{ left: `${(i / (PARADAS_VALOR.length - 1)) * 100}%` }}>
                {brl(m)}
              </span>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" aria-label="Diminuir valor" onClick={() => setIndice((i) => Math.max(0, i - 1))}
            className="h-9 w-9 rounded-full border border-border text-ink hover:bg-surface-muted">−</button>
          <p className="text-legenda text-ink-3">Arraste o marcador ou use os controles para ajustar o valor.</p>
          <button type="button" aria-label="Aumentar valor" onClick={() => setIndice((i) => Math.min(PARADAS_VALOR.length - 1, i + 1))}
            className="h-9 w-9 rounded-full border border-border text-ink hover:bg-surface-muted">+</button>
        </div>
      </Cartao>

      <Cartao className="p-7">
        <h2 className="text-secao">Frequência da contribuição</h2>
        <p className="text-pequeno mt-2 text-ink-2">Escolha de quanto em quanto tempo a cobrança deve ser feita.</p>
        <div role="radiogroup" aria-label="Frequência" className="mt-5 grid grid-cols-3 gap-1 rounded-md border border-border-soft bg-fill-1 p-1">
          {FREQS.map((x) => (
            <button key={x.v} type="button" role="radio" aria-checked={freq === x.v} onClick={() => setFreq(x.v)}
              className={`h-11 rounded-md text-pequeno ${freq === x.v ? 'bg-action font-semibold text-on-action' : 'text-ink-2 hover:bg-surface'}`}>
              {x.r}
            </button>
          ))}
        </div>
        <p className="text-legenda mt-3 text-ink-3">
          {freq === 'mensal' ? `Cobrança todo dia ${diaCobranca}` : freq === 'quinzenal' ? 'Cobrança a cada 15 dias' : 'Cobrança a cada 7 dias'} · {f.porAno} cobranças por ano
        </p>
      </Cartao>

      <Cartao className="p-7">
        <h2 className="text-card">Resumo</h2>
        <dl className="mt-4 divide-y divide-border-soft text-pequeno">
          {[
            ['Plano atual', `${brl(valorAtual / 100)},00 · ${freqAtual}`],
            ['Novo plano', mudou ? `${brl(reais)},00 · ${freq}` : 'sem alteração'],
            ['Meio de pagamento', meio],
            ['Próxima cobrança', proxima],
            ['Início da alteração', 'a partir da próxima cobrança'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-3"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        {estado?.erro && <div className="mt-4"><Aviso>{estado.erro}</Aviso></div>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Botao type="submit" disabled={!mudou || enviando}>{enviando ? 'Confirmando…' : 'Confirmar alteração'}</Botao>
          <BotaoLink href="/" variante="secundario">Cancelar</BotaoLink>
        </div>
      </Cartao>
    </form>
  );
}
