import type { DoacoesMes } from '@/lib/tipos';
import { reaisInteiros } from '@/lib/formato';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Arrecadação mensal do ano (todos os doadores, só totais) contra a meta anual. */
export function GraficoMeta({ ano, meses, pctMeta }: { ano: number; meses: DoacoesMes[]; pctMeta: number | null }) {
  const porMes = new Map(meses.map((m) => [Number(m.periodo.slice(5, 7)) - 1, Number(m.total_centavos)]));
  const max = Math.max(1, ...porMes.values());
  const hoje = new Date();
  const mesAtual = hoje.getFullYear() === ano ? hoje.getMonth() : 11;
  return (
    <div className="rounded-lg border border-border-soft bg-surface-muted p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-caps text-ink-2">Progresso da meta anual</p>
        {pctMeta !== null && <p className="text-sub">{pctMeta}% da meta</p>}
      </div>
      <div className="mt-4 flex h-[172px] items-end gap-3" role="img"
        aria-label={`Arrecadação mensal de ${ano}${pctMeta !== null ? `, ${pctMeta}% da meta anual` : ''}`}>
        {MESES.map((m, i) => {
          const v = porMes.get(i) ?? 0;
          const futuro = i > mesAtual;
          return (
            <div key={m} className="flex h-full flex-1 flex-col justify-end" title={`${m}/${ano}: ${reaisInteiros(v)}`}>
              <div className={`w-full rounded-t-sm ${futuro ? 'bg-skeleton' : i === mesAtual ? 'bg-chart-1-emphasis' : 'bg-chart-1'}`}
                style={{ height: `${futuro ? 6 : Math.max(4, (v / max) * 100)}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-legenda text-ink-3"><span>jan</span><span>dez</span></div>
    </div>
  );
}
