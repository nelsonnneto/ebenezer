import { Foto } from '@/components/ui';
import { urlStorage } from '@/lib/dados';
import type { Publicacao } from '@/lib/tipos';

function relativo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
}

export function CartaoPublicacao({ p, compacto = false }: { p: Publicacao; compacto?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border-soft bg-surface-muted p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-caps text-ink-2">{p.programa}</p>
        <p className="text-legenda shrink-0 text-ink-3">{relativo(p.publicada_em)}</p>
      </div>
      <h3 className="text-card mt-2">{p.titulo}</h3>
      <Foto src={urlStorage(p.imagem_url)} alt={p.imagem_alt ?? ''} className="mt-3 aspect-[304/150] w-full" />
      <p className={`text-pequeno mt-3 whitespace-pre-line text-ink-2 ${compacto ? 'line-clamp-3' : ''}`}>{p.texto}</p>
      {p.metrica_rotulo && (
        <p className="mt-3 self-start rounded-full border border-border-soft bg-surface px-3 py-1 text-legenda text-ink-2">{p.metrica_rotulo}</p>
      )}
    </article>
  );
}
