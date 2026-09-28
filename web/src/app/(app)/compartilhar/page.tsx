import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho } from '@/components/shell/Cabecalho';
import { Chip, Nota } from '@/components/ui';
import { Insignia } from '@/components/dominio/Insignia';
import { Monograma } from '@/components/shell/Logo';
import { conquistas, continuidade, linkConvite, meuEmbaixador, sessao, urlStorage } from '@/lib/dados';
import { primeiroNome } from '@/lib/formato';
import { Compartilhador } from './Compartilhador';

export const metadata: Metadata = { title: 'Compartilhar' };
type Conteudo = 'certificado' | 'conquista' | 'convite';

export default async function Compartilhar({ searchParams }: { searchParams: Promise<{ conteudo?: Conteudo; marco?: string }> }) {
  const sp = await searchParams;
  const [{ perfil }, minhas, cont, emb] = await Promise.all([sessao(), conquistas(), continuidade(), meuEmbaixador()]);
  const doMarco = minhas.filter((c) => c.trilha === 'doador');
  const marco = doMarco.find((c) => c.codigo === sp.marco) ?? doMarco[0] ?? null;   // mais recente primeiro
  const conteudo: Conteudo = !marco ? 'convite' : (sp.conteudo ?? 'conquista');
  const link = linkConvite(emb?.ativo ? emb.slug : null);
  const meses = cont.meses_consecutivos;
  const nome = primeiroNome(perfil.nome_exibicao);

  // Só marco e tempo de apoio: nunca valor (nota de governança do protótipo).
  const l = '{{link}}';
  const sugestao =
    conteudo === 'convite'
      ? `Apoio o Instituto Social Ebenézer, que acompanha crianças de 3 a 11 anos no Jardim Ângela, em São Paulo. Eles prestam contas todo mês, com indicadores agregados e sem expor nenhuma criança. Conheça: ${l}`
      : `${meses > 0 ? `Há ${meses} ${meses === 1 ? 'mês' : 'meses'} faço` : 'Faço'} parte da comunidade que sustenta os programas do Instituto Social Ebenézer, no Jardim Ângela. ${conteudo === 'certificado' ? 'Recebi o certificado' : 'Hoje alcancei o marco'} ${marco!.nome}. Se quiser conhecer o trabalho: ${l}`;

  const aba = (c: Conteudo) => `?conteudo=${c}${marco ? `&marco=${marco.codigo}` : ''}`;

  return (
    <Moldura ativa="jornada">
      <Cabecalho volta={{ href: '/jornada', rotulo: 'Voltar' }} rotulo="Compartilhar" titulo="Leve sua causa para a sua rede"
        texto="Escolha o que publicar, revise a mensagem e selecione onde deseja compartilhar. Valores contribuídos nunca aparecem no conteúdo publicado." />
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-10">
        <section className="rounded-lg border border-border bg-surface p-7">
          <h2 className="text-card">O que será publicado</h2>
          <div className="mt-4 flex gap-2">
            {marco && <Chip href={aba('certificado')} ativo={conteudo === 'certificado'} scroll={false}>Certificado</Chip>}
            {marco && <Chip href={aba('conquista')} ativo={conteudo === 'conquista'} scroll={false}>Conquista</Chip>}
            <Chip href={aba('convite')} ativo={conteudo === 'convite'} scroll={false}>Convite</Chip>
          </div>
          <div className="relative mt-5 flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-md bg-fill-4 px-10 py-12 text-center text-on-action" data-testid="previa">
            {conteudo === 'convite' ? (
              <>
                <img src={urlStorage('midia/06-patio-grupo.jpg')!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="relative flex flex-col items-center">
                  <span className="rounded-md bg-surface p-1"><Monograma tamanho={36} /></span>
                  <p className="mt-5 max-w-[560px] font-serif text-[24px] italic leading-8">“Se mudarmos o começo da história, mudamos a história toda.”</p>
                  <p className="text-corpo mt-4 max-w-[560px] text-selected">{nome} apoia o Instituto Social Ebenézer{meses > 0 ? ` há ${meses} ${meses === 1 ? 'mês' : 'meses'}` : ''}. Some-se a essa rede.</p>
                  <p className="mt-5 rounded-full bg-white/15 px-5 py-2 text-sub">{link.replace(/^https?:\/\//, '')}</p>
                </div>
              </>
            ) : (
              <>
                <span className="rounded-full bg-fill-3/40 p-2"><Insignia codigo={marco!.codigo} conquistada tamanho={64} /></span>
                <p className="mt-4 font-serif text-[30px] font-semibold">{marco!.nome}</p>
                <p className="text-corpo mt-3 max-w-[560px] text-selected">
                  {conteudo === 'certificado' ? `Certificado de reconhecimento · registro ${marco!.numero_registro}. ` : ''}{marco!.descricao}
                </p>
                <p className="mt-5 flex items-center gap-2 text-pequeno"><span className="rounded bg-surface p-0.5"><Monograma tamanho={16} /></span>{link.replace(/^https?:\/\//, '').split('/r/')[0]}</p>
              </>
            )}
          </div>
        </section>

        <Compartilhador conteudo={conteudo} textoSugerido={sugestao} linkBase={link} />

        {!emb?.ativo && <p className="text-pequeno text-ink-2">Quer saber quem chegou pelo seu convite? <a href="/mobilizar" className="underline">Ative seu link de embaixador</a>.</p>}
        <Nota>O conteúdo publicado mostra apenas o marco alcançado e o tempo de apoio. Valores contribuídos permanecem privados e as imagens usadas são ilustrativas, sem identificação de qualquer criança atendida.</Nota>
      </div>
    </Moldura>
  );
}
