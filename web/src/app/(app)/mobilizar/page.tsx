import type { Metadata } from 'next';
import QRCode from 'qrcode';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho } from '@/components/shell/Cabecalho';
import { Aviso, Botao, BotaoLink, Cartao, Foto, Kpi, Nota, Progresso, Rotulo } from '@/components/ui';
import { Insignia } from '@/components/dominio/Insignia';
import { Copiar } from '@/components/dominio/Copiar';
import { continuidade, linkConvite, meuEmbaixador, painelRede, trilhaEmbaixador, urlStorage } from '@/lib/dados';
import { inteiro, mesAnoCurto, reaisInteiros } from '@/lib/formato';
import { tornarEmbaixador } from '../acoes-rede';

export const metadata: Metadata = { title: 'Mobilizar' };

const CANAL: Record<string, string> = { whatsapp: 'WhatsApp', linkedin: 'LinkedIn', instagram: 'Instagram', x: 'X', facebook: 'Facebook', evento: 'Evento presencial', direto: 'Indicação direta' };
const BOTAO_SEC = 'inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-botao text-ink hover:bg-surface-muted';

export default async function Mobilizar({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sp = await searchParams;
  const emb = await meuEmbaixador();

  if (!emb?.ativo) {
    const cont = await continuidade();
    return (
      <Moldura ativa="mobilizar">
        <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Área do embaixador" titulo="Multiplique seu impacto"
          texto="Convide sua rede com um link identificado. Você acompanha quantas pessoas chegaram por seu convite e quantas se tornaram doadoras recorrentes." />
        <div className="mx-auto max-w-[928px] px-6 py-10 flex flex-col gap-6">
          {sp.erro && <Aviso>{sp.erro}</Aviso>}
          <Cartao className="p-8">
            <h2 className="text-secao">Ative o seu link de embaixador</h2>
            <p className="text-corpo mt-3 text-ink-2">
              Você recebe um endereço próprio, materiais aprovados pela coordenação e um painel com o resultado da sua mobilização — sem ranking entre embaixadores e sem exposição dos valores de quem você convidar.
            </p>
            {cont.doacoes_confirmadas > 0
              ? <form action={tornarEmbaixador} className="mt-6"><Botao>Ativar meu link</Botao></form>
              : <BotaoLink href="/doar" className="mt-6">Fazer minha primeira contribuição</BotaoLink>}
            {cont.doacoes_confirmadas === 0 && <p className="text-legenda mt-3 text-ink-3">A Central do Embaixador é liberada após a primeira contribuição.</p>}
          </Cartao>
          {emb && !emb.ativo && <Aviso>Seu link foi desativado pela coordenação. Fale com o Instituto para reativá-lo.</Aviso>}
        </div>
      </Moldura>
    );
  }

  const [{ rede, canais, meses, materiais, meta }, marcos] = await Promise.all([painelRede(), trilhaEmbaixador()]);
  const link = linkConvite(emb.slug);
  const qr = await QRCode.toString(link, { type: 'svg', margin: 1, color: { dark: '#006255', light: '#ffffff' } });
  const qrDownload = `data:image/svg+xml;utf8,${encodeURIComponent(qr)}`;
  const maxCanal = Math.max(1, ...canais.map((c) => Number(c.doadores)));
  // Evolução acumulada dos últimos 12 meses
  const hoje = new Date();
  const serie = Array.from({ length: 12 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth() - 11 + i, 1));
  let acumulado = meses.filter((m) => new Date(`${m.mes}T12:00:00`) < serie[0]!).reduce((s, m) => s + m.novos_doadores, 0);
  const barras = serie.map((d) => {
    acumulado += meses.filter((m) => m.mes.slice(0, 7) === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`).reduce((s, m) => s + m.novos_doadores, 0);
    return { d, v: acumulado };
  });
  const alvo = Number(meta?.alvo ?? Math.max(1, acumulado));

  return (
    <Moldura ativa="mobilizar">
      <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Área do embaixador" titulo="Multiplique seu impacto"
        texto="Convide sua rede com um link identificado. Você acompanha quantas pessoas chegaram por seu convite e quantas se tornaram doadoras recorrentes.">
        <div className="mt-8 grid grid-cols-4 gap-4">
          <Kpi valor={inteiro(rede?.doadores_mobilizados)} rotulo="doadores mobilizados" />
          <Kpi valor={reaisInteiros(rede?.valor_total_centavos)} rotulo="arrecadado pela sua rede" />
          <Kpi valor={inteiro(rede?.recorrentes_originados)} rotulo="recorrentes originados" />
          <Kpi valor={`${inteiro(Number(rede?.taxa_conversao ?? 0) * 100)}%`} rotulo="taxa de conversão do link" />
        </div>
      </Cabecalho>

      <div className="mx-auto grid max-w-[1200px] grid-cols-[760px_1fr] gap-10 px-6 py-10">
        <div className="flex flex-col gap-6">
          {sp.ok === 'ativado' && <Aviso tom="ok">Seu link está ativo. Compartilhe e acompanhe o resultado aqui.</Aviso>}

          <Cartao className="p-7">
            <h2 className="text-secao">Seu link de embaixador</h2>
            <p className="text-pequeno mt-2 text-ink-2">Cada visita e cada doação que chegam por este endereço são atribuídas a você.</p>
            <p className="mt-5 rounded-md border border-border-soft bg-fill-1 px-4 py-3 text-corpo" data-testid="link-embaixador">{link.replace(/^https?:\/\//, '')}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Copiar texto={link} rotulo="Copiar link" className={BOTAO_SEC} />
              <BotaoLink href="/compartilhar?conteudo=convite" className="h-11">Compartilhar</BotaoLink>
            </div>
            <div className="mt-5 flex items-center gap-5 rounded-md bg-fill-1 p-4">
              <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-md border border-border-soft bg-surface" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR Code do seu link" role="img" />
              <div>
                <p className="text-sub">QR Code da sua campanha</p>
                <p className="text-pequeno mt-1 text-ink-2">Para eventos, crachás, apresentações e material impresso.</p>
                <a href={qrDownload} download={`qrcode-${emb.slug}.svg`} className="text-pequeno mt-1 inline-block text-ink hover:text-action">Baixar imagem em alta resolução&nbsp;&nbsp;→</a>
              </div>
            </div>
          </Cartao>

          <Cartao className="p-7">
            <h2 className="text-secao">Materiais de campanha</h2>
            <p className="text-pequeno mt-2 text-ink-2">Peças aprovadas pela coordenação, com o link já embutido.</p>
            {materiais.find((m) => m.imagem_url) && (
              <>
                <Rotulo className="mt-5">Banco de imagens aprovadas</Rotulo>
                <Foto src={urlStorage(materiais.find((m) => m.tipo === 'card')?.imagem_url)} alt="Imagem institucional para campanhas" className="mt-3 h-[230px] w-full" />
                <p className="text-legenda mt-2 text-ink-3">Imagem ilustrativa liberada pela coordenação para uso em posts e apresentações. Não retrata crianças atendidas pelo Instituto.</p>
              </>
            )}
            <ul className="mt-5 divide-y divide-border-soft">
              {materiais.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 py-4">
                  <div><p className="text-sub">{m.titulo}</p><p className="text-legenda text-ink-3">{m.descricao}</p></div>
                  {m.texto_pronto
                    ? <Copiar texto={m.texto_pronto} rotulo="Copiar" className="text-botao text-ink hover:text-action" />
                    : <a href={urlStorage(m.imagem_url ?? m.url_storage) ?? '#'} download className="text-botao text-ink hover:text-action">Baixar</a>}
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao className="p-7">
            <h2 className="text-secao">Resultados da sua rede</h2>
            <p className="text-pequeno mt-2 text-ink-2">Doações atribuídas ao seu link, por período e por canal de origem.</p>
            <div className="mt-5 grid grid-cols-[1fr_1.25fr] gap-5">
              <div className="rounded-lg border border-border-soft bg-surface-muted p-4">
                <div className="flex items-baseline justify-between"><Rotulo>Progresso da rede</Rotulo>
                  <span className="text-legenda font-semibold">{acumulado} de {inteiro(alvo)}</span></div>
                <div className="mt-4 flex h-[150px] items-end gap-1.5" role="img" aria-label={`Doadores mobilizados acumulados: ${acumulado} de ${inteiro(alvo)}`}>
                  {barras.map((b, i) => (
                    <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${mesAnoCurto(b.d)}: ${b.v}`}>
                      <div className={`w-full rounded-t-sm ${i === barras.length - 1 ? 'bg-chart-1-emphasis' : 'bg-chart-1'}`} style={{ height: `${Math.max(3, (b.v / alvo) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-legenda text-ink-3"><span>{mesAnoCurto(barras[0]!.d)}</span><span>meta: {inteiro(alvo)}</span></div>
              </div>
              <div className="rounded-lg border border-border-soft p-4">
                <div className="flex items-baseline justify-between"><Rotulo>Origem das doações</Rotulo><span className="text-legenda text-ink-3">doadores · acessos</span></div>
                <ul className="mt-3 flex flex-col gap-3">
                  {canais.map((c) => (
                    <li key={c.canal} className="grid grid-cols-[110px_1fr_56px] items-center gap-3 text-pequeno">
                      <span>{CANAL[c.canal] ?? c.canal}</span>
                      <Progresso valor={Number(c.doadores) / maxCanal} rotulo={CANAL[c.canal]} />
                      <span className="text-right"><b>{c.doadores}</b> <span className="text-ink-3">· {c.acessos}</span></span>
                    </li>
                  ))}
                  {canais.length === 0 && <li className="text-pequeno text-ink-2">Ainda não há acessos pelo seu link.</li>}
                </ul>
              </div>
            </div>
          </Cartao>
        </div>

        <aside className="flex flex-col gap-6">
          <Cartao className="p-6">
            <h2 className="text-card">Como funciona</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {[['Compartilhe seu link', 'Envie por WhatsApp, publique nas redes ou use o QR Code em eventos.'],
                ['Sua rede conhece o trabalho', 'Quem chega pelo seu link vê os programas e pode doar em poucos passos.'],
                ['Você acompanha o resultado', 'Cada doação originada aparece aqui, com o canal de onde veio.']].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-action text-legenda font-bold text-on-action">{i + 1}</span>
                  <div><p className="text-sub">{t}</p><p className="text-legenda mt-0.5 text-ink-2">{d}</p></div>
                </li>
              ))}
            </ol>
          </Cartao>
          <Cartao className="p-6">
            <h2 className="text-card">Reconhecimento de embaixador</h2>
            <p className="text-pequeno mt-1 text-ink-2">Marcos próprios da trilha de mobilização.</p>
            <ul className="mt-4 flex flex-col gap-4">
              {marcos.filter((m) => m.codigo !== 'embaixador_ebenezer').map((m) => (
                <li key={m.codigo} className="flex items-center gap-3">
                  <Insignia codigo={m.codigo} conquistada={m.conquistado} tamanho={40} />
                  <div className="flex-1">
                    <p className={`text-sub ${m.conquistado ? '' : 'text-ink-2'}`}>{m.nome}</p>
                    <p className="text-legenda text-ink-3">{m.doadores_requeridos ? `${m.doadores_requeridos} doadores mobilizados` : m.codigo === 'voz_da_causa' ? 'Primeiro compartilhamento' : 'Meta da rede atingida'}</p>
                  </div>
                  <span className="text-legenda text-ink-2">{m.conquistado ? 'Conquistado' : m.doadores_requeridos ? `Faltam ${Math.max(0, m.doadores_requeridos - Number(rede?.doadores_mobilizados ?? 0))}` : 'Pendente'}</span>
                </li>
              ))}
            </ul>
          </Cartao>
          <Nota>A mobilização mede alcance e conversão da sua rede. Não há ranking público entre embaixadores, comparação por valor arrecadado nem exposição de quem doou.</Nota>
        </aside>
      </div>
    </Moldura>
  );
}
