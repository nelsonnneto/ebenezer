import { Monograma } from '@/components/shell/Logo';
import { Insignia } from './Insignia';
import { data } from '@/lib/formato';
import type { Conquista } from '@/lib/tipos';
import { siteUrl } from '@/lib/ambiente';

const EXTENSO: Record<number, string> = { 3: 'três', 6: 'seis', 12: 'doze', 24: 'vinte e quatro' };

function motivo(c: Conquista, meses: number | null) {
  if (c.codigo === 'primeiro_passo') return 'por sua primeira contribuição em apoio aos programas do Instituto Social Ebenézer.';
  if (meses) return `por haver mantido contribuição recorrente ininterrupta durante ${meses} (${EXTENSO[meses] ?? meses}) meses em apoio aos programas do Instituto Social Ebenézer.`;
  return `${c.descricao.charAt(0).toLowerCase()}${c.descricao.slice(1)}`;
}

/** Certificado formal (Figma: componente Certificado). IBM Plex Serif, moldura dupla, registro verificável. */
export function Certificado({ nome, c, meses }: { nome: string; c: Conquista; meses: number | null }) {
  return (
    <div id="certificado" className="relative bg-surface p-4 shadow-sm">
      <div className="relative border-[3px] border-fill-4 p-[3px]">
        <div className="flex flex-col items-center border border-fill-4 px-16 pb-8 pt-10 text-center font-serif">
          {['left-[-6px] top-[-6px]', 'right-[-6px] top-[-6px]', 'left-[-6px] bottom-[-6px]', 'right-[-6px] bottom-[-6px]'].map((p) => (
            <span key={p} className={`absolute h-2.5 w-2.5 bg-fill-4 ${p}`} aria-hidden />
          ))}
          <Monograma tamanho={34} />
          <p className="mt-3 font-sans text-[11px] font-bold tracking-[3px] text-ink">INSTITUTO SOCIAL EBENÉZER</p>
          <p className="mt-1 font-sans text-[10px] tracking-[1px] text-ink-3">Jardim Ângela · São Paulo</p>
          <span className="mt-3 h-px w-12 bg-fill-4" aria-hidden />
          <p className="mt-12 text-[17px] font-semibold tracking-[4px] text-ink">CERTIFICADO DE RECONHECIMENTO</p>
          <p className="mt-2 text-[12px] italic text-ink-2">O Instituto Social Ebenézer confere o presente certificado a</p>
          <p className="mt-3 border-b border-ink-3 px-6 pb-2 text-[30px] font-semibold text-ink">{nome}</p>
          <p className="mt-4 max-w-[520px] text-[12.5px] leading-6 text-ink-2">
            pelo alcance do marco <b className="font-semibold uppercase text-ink">{c.nome}</b> do Programa de Reconhecimento de Doadores, {motivo(c, meses)}
          </p>
          <div className="mt-12 grid w-full grid-cols-[1fr_auto_1fr] items-end gap-6 font-sans">
            <div className="border-t border-ink-3 pt-2 text-[10px]"><b className="block text-ink">Coordenação Geral</b><span className="text-ink-3">Instituto Social Ebenézer</span></div>
            <Insignia codigo={c.codigo} conquistada tamanho={54} />
            <div className="border-t border-ink-3 pt-2 text-[10px]"><b className="block text-ink">Diretoria</b><span className="text-ink-3">Instituto Social Ebenézer</span></div>
          </div>
          <p className="mt-6 font-sans text-[9.5px] text-ink-3">
            São Paulo, {data(c.alcancada_em)}&nbsp;&nbsp;·&nbsp;&nbsp;Registro nº {c.numero_registro}&nbsp;&nbsp;·&nbsp;&nbsp;Verificação em {siteUrl().replace(/^https?:\/\//, '')}/verificar
          </p>
        </div>
      </div>
    </div>
  );
}
