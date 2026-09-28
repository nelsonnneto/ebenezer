'use client';
import { useState } from 'react';
import { registrarCompartilhamento } from '../acoes-rede';
import { Copiar } from '@/components/dominio/Copiar';
import type { Rede } from '@/lib/tipos';

const REDES: { v: Rede; nome: string; acao: string; cor: string }[] = [
  { v: 'instagram', nome: 'Instagram', acao: 'Copia o texto e abre o Instagram', cor: '#C13584' },
  { v: 'whatsapp', nome: 'WhatsApp', acao: 'Enviar em conversa', cor: '#25D366' },
  { v: 'x', nome: 'X', acao: 'Publicar', cor: '#000000' },
  { v: 'facebook', nome: 'Facebook', acao: 'Publicar no feed', cor: '#1877F2' },
  { v: 'linkedin', nome: 'LinkedIn', acao: 'Publicar no perfil', cor: '#0A66C2' },
];

function destino(rede: Rede, texto: string, link: string) {
  const e = encodeURIComponent;
  switch (rede) {
    case 'whatsapp': return `https://wa.me/?text=${e(texto)}`;
    case 'x': return `https://x.com/intent/post?text=${e(texto)}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${e(link)}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${e(link)}`;
    case 'instagram': return 'https://www.instagram.com/';
  }
}

/** textoSugerido traz o marcador {{link}}. Mensagem editável + botões das redes. Cada clique registra o compartilhamento (marco Voz da Causa) e abre a rede. */
export function Compartilhador({ conteudo, textoSugerido, linkBase }: {
  conteudo: 'certificado' | 'conquista' | 'convite'; textoSugerido: string; linkBase: string;
}) {
  const sugerido = textoSugerido.replace('{{link}}', linkBase);
  const [texto, setTexto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const textoPara = (rede: Rede) => (texto ?? sugerido).replace(linkBase, `${linkBase}?c=${rede}`);

  // A aba abre de forma síncrona no clique (evita bloqueio de pop-up); o registro segue em paralelo.
  function publicar(rede: Rede) {
    const msg = textoPara(rede);
    if (rede === 'instagram') navigator.clipboard?.writeText(msg).catch(() => {});
    window.open(destino(rede, msg, `${linkBase}?c=${rede}`), '_blank', 'noopener,noreferrer');
    void registrarCompartilhamento(conteudo, rede);
    setAviso(rede === 'instagram' ? 'Texto copiado. Cole na legenda da sua publicação no Instagram.' : `Abrimos o ${REDES.find((r) => r.v === rede)!.nome} em outra aba.`);
  }

  return (
    <div className="grid grid-cols-[1fr_380px] items-start gap-8">
      <section className="rounded-lg border border-border bg-surface p-7" aria-labelledby="msg">
        <h2 id="msg" className="text-card">Mensagem sugerida</h2>
        <textarea value={texto ?? sugerido} onChange={(e) => setTexto(e.target.value)} rows={5}
          aria-label="Mensagem que será publicada"
          className="mt-4 w-full rounded-md border border-border bg-surface p-4 text-corpo leading-6" />
        <div className="mt-2 flex justify-between text-legenda text-ink-3">
          <span>{(texto ?? sugerido).length} caracteres</span>
          <button type="button" onClick={() => setTexto(null)} className="hover:text-ink">Restaurar texto sugerido</button>
        </div>
        {aviso && <p role="status" className="mt-4 rounded-md border border-fill-2 bg-selected px-4 py-3 text-pequeno text-fill-4">{aviso}</p>}
      </section>
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-card">Escolha onde publicar</h2>
          <p className="text-pequeno mt-1 text-ink-2">Abre o aplicativo ou o site da rede com a mensagem já preenchida.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {REDES.map((r) => (
              <li key={r.v}>
                <button type="button" onClick={() => publicar(r.v)}
                  className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left hover:bg-surface-muted">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-bold text-white" style={{ background: r.cor }} aria-hidden>{r.nome[0]}</span>
                  <span className="flex-1"><span className="text-sub block">{r.nome}</span><span className="text-legenda text-ink-3">{r.acao}</span></span>
                  <span aria-hidden>→</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-card">Ou copie o link</h2>
          <p className="mt-3 rounded-md border border-border-soft bg-fill-1 px-3 py-2.5 text-pequeno">{linkBase.replace(/^https?:\/\//, '')}</p>
          <Copiar texto={linkBase} rotulo="Copiar link" className="mt-3 h-11 w-full rounded-md border border-border text-botao hover:bg-surface-muted" />
        </section>
      </div>
    </div>
  );
}
