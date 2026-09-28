import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/shell/Logo';
import { Rodape } from '@/components/shell/Rodape';
import { BotaoLink, Kpi, Nota, Progresso, Rotulo } from '@/components/ui';
import { CartaoPublicacao } from '@/components/dominio/CartaoPublicacao';
import { urlStorage } from '@/lib/dados';
import { inteiro } from '@/lib/formato';
import { vitrine } from '@/lib/publico';

export const metadata: Metadata = {
  title: 'Conheça o Instituto',
  description: 'Instituto Social Ebenézer · Jardim Ângela, São Paulo. Programas, indicadores agregados e como apoiar.',
};

const PASSOS = [
  ['Crie sua conta', 'Nome, e-mail e senha. Nenhum documento é pedido para contribuir.'],
  ['Escolha como apoiar', 'Contribuição única ou recorrente, por Pix ou cartão. Você altera, pausa ou encerra quando quiser.'],
  ['Acompanhe o impacto', 'Atividades dos programas e indicadores agregados todo mês, sem expor nenhuma criança.'],
];

export default async function Conheca({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const [{ convite }, v] = await Promise.all([searchParams, vitrine()]);
  const ano = new Date().getFullYear();
  const pctMeta = v.meta ? Math.min(1, Number(v.meta.realizado) / Number(v.meta.alvo)) : null;
  const apoiar = v.logado ? '/doar' : '/cadastro';

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-border-soft bg-surface">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Logo href="/conheca" />
          <nav aria-label="Conta" className="flex items-center gap-3">
            {v.logado ? <BotaoLink href="/" variante="secundario" className="h-10 px-4">Ir para minha conta</BotaoLink> : (
              <>
                <Link href="/acesso" className="text-botao px-3 text-ink-2 hover:text-ink">Entrar</Link>
                <BotaoLink href="/cadastro" className="h-10 px-4">Quero apoiar</BotaoLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-fill-4 text-on-action">
        <img src={urlStorage('midia/06-patio-grupo.jpg')!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20">
          {convite && <p className="mb-6 inline-block rounded-full bg-white/15 px-4 py-1.5 text-pequeno">Você chegou pelo convite de alguém que já apoia o Instituto.</p>}
          <p className="text-caps text-selected">Instituto Social Ebenézer · Jardim Ângela, São Paulo</p>
          <h1 className="mt-4 max-w-[760px] font-serif text-[44px] font-semibold leading-[52px]">Se mudarmos o começo da história, mudamos a história toda.</h1>
          <p className="text-corpo mt-5 max-w-[640px] text-selected">
            O Instituto acompanha crianças de 3 a 11 anos no contraturno escolar, com reforço, oficinas e cuidado com a primeira infância.
            Quem apoia acompanha, mês a mês, o que a contribuição sustenta.
          </p>
          <div className="mt-8 flex gap-3">
            <BotaoLink href={apoiar} className="h-12 bg-surface px-6 !text-fill-4 hover:bg-selected">Quero apoiar</BotaoLink>
            <BotaoLink href="#programas" variante="secundario" className="h-12 border-white/60 !bg-transparent px-6 !text-on-action hover:!bg-white/10">Conhecer os programas</BotaoLink>
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6 py-14">
        <section aria-labelledby="impacto">
          <Rotulo>Impacto em {ano}</Rotulo>
          <h2 id="impacto" className="text-secao mt-2">O que os programas realizaram este ano</h2>
          <div className="mt-6 grid grid-cols-4 gap-4">
            <Kpi valor={inteiro(v.impacto.criancas_atendidas)} rotulo="crianças atendidas no último mês" />
            <Kpi valor={inteiro(v.impacto.horas_atividade)} rotulo="horas de atividade no ano" />
            <Kpi valor={`${inteiro(v.impacto.frequencia_media)}%`} rotulo="frequência média" />
            <Kpi valor={v.impacto.programas.length} rotulo="programas com indicador público" />
          </div>
          {v.meta && pctMeta !== null && (
            <div className="mt-6 rounded-lg border border-border bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-sub">{v.meta.rotulo}</p>
                <p className="text-sub">{Math.round(pctMeta * 100)}% da meta</p>
              </div>
              <Progresso valor={pctMeta} rotulo="Progresso da meta anual" />
              <p className="text-legenda mt-3 text-ink-3">Total agregado de todas as contribuições. Nenhum valor individual é exibido.</p>
            </div>
          )}
        </section>

        <section id="programas" aria-labelledby="progs" className="scroll-mt-6">
          <Rotulo>Programas</Rotulo>
          <h2 id="progs" className="text-secao mt-2">Onde a sua contribuição chega</h2>
          <div className="mt-6 grid grid-cols-2 gap-5">
            {v.programas.map((p) => (
              <article key={p.codigo} className="rounded-lg border border-border bg-surface p-6">
                <h3 className="text-card">{p.nome}</h3>
                <p className="text-legenda mt-1 text-ink-3">{p.faixa_etaria} · {p.cadencia}</p>
                {p.descricao && <p className="text-pequeno mt-3 text-ink-2">{p.descricao}</p>}
              </article>
            ))}
          </div>
        </section>

        {v.feed.length > 0 && (
          <section aria-labelledby="feed">
            <Rotulo>Atividades recentes</Rotulo>
            <h2 id="feed" className="text-secao mt-2">O que aconteceu nos programas</h2>
            <div className="mt-6 grid grid-cols-3 gap-5">{v.feed.map((p) => <CartaoPublicacao key={p.id} p={p} compacto />)}</div>
          </section>
        )}

        <section aria-labelledby="como" className="rounded-lg border border-border bg-surface p-8">
          <h2 id="como" className="text-secao">Como apoiar</h2>
          <ol className="mt-6 grid grid-cols-3 gap-6">
            {PASSOS.map(([t, d], i) => (
              <li key={t}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-4 text-sub text-on-action">{i + 1}</span>
                <p className="text-sub mt-3">{t}</p>
                <p className="text-pequeno mt-1 text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex items-center gap-4">
            <BotaoLink href={apoiar} className="h-12 px-6">Quero apoiar</BotaoLink>
            {!v.logado && <p className="text-pequeno text-ink-2">Já apoia? <Link href="/acesso" className="underline">Entrar</Link></p>}
          </div>
        </section>

        <Nota>
          Transparência com proteção: os indicadores são agregados por programa e as imagens são ilustrativas — não retratam crianças atendidas.
          Nenhuma criança é identificada, nenhum resultado individual é divulgado e nenhum valor de contribuição é exibido.
        </Nota>
      </main>
      <Rodape />
    </div>
  );
}
