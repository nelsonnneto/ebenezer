import type { Metadata } from 'next';
import Link from 'next/link';
import { Moldura } from '@/components/shell/Moldura';
import { BotaoLink, Cartao, Chip, Kpi, LinkSeta, Nota, Progresso, Rotulo } from '@/components/ui';
import { Insignia } from '@/components/dominio/Insignia';
import { CartaoPublicacao } from '@/components/dominio/CartaoPublicacao';
import { FiltroPainel } from '@/components/dominio/FiltroPainel';
import { GraficoMeta } from '@/components/dominio/GraficoMeta';
import {
  continuidade, conquistas, doacoesPorMes, embaixadorDoUsuario, feed, metaAnual, painelImpacto, programas, proximoMarco, recorrenciaAtual, trilha,
} from '@/lib/dados';
import { FREQUENCIA, data, inteiro, maiuscula, reais } from '@/lib/formato';
import type { Recorrencia } from '@/lib/tipos';

export const metadata: Metadata = { title: 'Home' };

export default async function Home({ searchParams }: { searchParams: Promise<{ programa?: string; ano?: string; feed?: string }> }) {
  const sp = await searchParams;
  const anoAtual = new Date().getFullYear();
  const ano = Number(sp.ano) || anoAtual;

  const [cont, prox, marcos, minhas, rec, painel, meses, meta, posts, progs, emb] = await Promise.all([
    continuidade(), proximoMarco(), trilha(), conquistas(), recorrenciaAtual(),
    painelImpacto({ ano, programa: sp.programa }), doacoesPorMes(ano), metaAnual(),
    feed(2, sp.feed), programas(), embaixadorDoUsuario(),
  ]);
  const pctMeta = meta ? Math.round((Number(meta.realizado) / Number(meta.alvo)) * 100) : null;
  const doouAlgumaVez = cont.doacoes_confirmadas > 0;
  const programasComIndicador = progs.filter((p) => painel.programas.some((x) => x.codigo === p.codigo));

  return (
    <Moldura ativa="home">
      {/* Abertura — status da jornada */}
      <div className="border-b border-border-soft bg-surface-muted">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_420px] gap-14 px-6 py-14">
          <div className="flex flex-col justify-center">
            <p className="text-caps text-ink-2">Minha jornada de impacto</p>
            <h1 className="text-display mt-3 max-w-[640px]">
              {cont.meses_consecutivos > 0
                ? <>Você faz parte dessa transformação há {cont.meses_consecutivos} {cont.meses_consecutivos === 1 ? 'mês' : 'meses'}.</>
                : doouAlgumaVez ? <>Obrigado por fazer parte dessa transformação.</> : <>Boas-vindas ao Ebenézer Conecta.</>}
            </h1>
            <p className="text-corpo mt-4 max-w-[640px] text-ink-2">
              {rec?.status === 'ativa'
                ? 'Sua contribuição recorrente sustenta os programas do Instituto. Acompanhe abaixo os indicadores agregados, as atualizações da coordenação e o resultado do seu apoio.'
                : 'Com uma contribuição recorrente, você deixa de precisar lembrar de doar — e pode alterar, pausar ou cancelar quando quiser, sem justificativa.'}
            </p>
            <div className="mt-8 flex gap-3">
              {rec ? (
                <>
                  <BotaoLink href="/jornada">Ver minha jornada</BotaoLink>
                  <BotaoLink href="/recorrencia" variante="secundario">Gerenciar recorrência</BotaoLink>
                </>
              ) : (
                <>
                  <BotaoLink href="/doar">Tornar meu apoio contínuo</BotaoLink>
                  <BotaoLink href="/jornada" variante="secundario">Ver minha jornada</BotaoLink>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Cartao className="p-6">
              <Rotulo>Próximo marco</Rotulo>
              {prox ? (
                <>
                  <p className="text-card mt-2">{prox.nome}</p>
                  <div className="mt-4"><Progresso valor={Number(prox.progresso)} rotulo={`Progresso até ${prox.nome}`} /></div>
                  <p className="text-legenda mt-3 text-ink-3">
                    Faltam {prox.meses_faltantes} {prox.meses_faltantes === 1 ? 'mês' : 'meses'} · progresso medido por tempo de apoio contínuo
                  </p>
                </>
              ) : <p className="text-corpo mt-2 text-ink-2">Todos os marcos da trilha foram alcançados.</p>}
            </Cartao>
            <div className="grid grid-cols-2 gap-4">
              <Kpi valor={cont.meses_consecutivos} rotulo="meses de apoio contínuo" />
              <Kpi valor={minhas.filter((c) => c.trilha === 'doador').length} rotulo="conquistas registradas" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-[760px_1fr] gap-10 px-6 py-12">
        <div className="flex flex-col gap-8">
          {/* Dashboard de Impacto */}
          <Cartao className="p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-secao">Dashboard de Impacto</h2>
              <FiltroPainel programas={programasComIndicador} anos={[anoAtual, anoAtual - 1]} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Kpi valor={inteiro(painel.criancas_atendidas)} rotulo="Crianças atendidas" />
              <Kpi valor={inteiro(painel.horas_atividade)} rotulo="Horas de atividades" />
              <Kpi valor={`${inteiro(painel.frequencia_media)}%`} rotulo="Frequência média" />
            </div>
            <div className="mt-6"><GraficoMeta ano={ano} meses={meses} pctMeta={ano === anoAtual ? pctMeta : null} /></div>
            <div className="mt-6">
              <Rotulo>Frequência média por programa</Rotulo>
              <ul className="mt-3 flex flex-col gap-3">
                {painel.programas.map((p) => (
                  <li key={p.codigo} className="grid grid-cols-[220px_1fr_48px] items-center gap-4 text-pequeno">
                    <span>{p.nome}</span>
                    <Progresso valor={Number(p.frequencia ?? 0) / 100} rotulo={`Frequência média — ${p.nome}`} />
                    <span className="text-right font-semibold">{inteiro(p.frequencia)}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <Nota>Indicadores agregados dos programas. Nenhuma tela do doador exibe nome, diagnóstico ou evolução individual de criança. As imagens são ilustrativas e não retratam crianças atendidas pelo Instituto.</Nota>
            </div>
          </Cartao>

          {/* Feed de Atualizações */}
          <Cartao className="p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-secao">Feed de Atualizações</h2>
              <LinkSeta href="/atividades">Ver todas as publicações</LinkSeta>
            </div>
            <div className="mt-5 flex gap-2">
              <Chip href="?" ativo={!sp.feed} scroll={false}>Todos</Chip>
              <Chip href="?feed=primeira_infancia" ativo={sp.feed === 'primeira_infancia'} scroll={false}>Primeira Infância</Chip>
              <Chip href="?feed=lab_sonhos" ativo={sp.feed === 'lab_sonhos'} scroll={false}>Laboratório de Sonhos</Chip>
              <Chip href="?feed=reforco" ativo={sp.feed === 'reforco'} scroll={false}>Reforço Escolar</Chip>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5">
              {posts.map((p) => <CartaoPublicacao key={p.id} p={p} compacto />)}
              {posts.length === 0 && <p className="text-pequeno col-span-2 text-ink-2">Nenhuma publicação deste programa ainda.</p>}
            </div>
            <div className="mt-6">
              <Nota>Conteúdos institucionais publicados pela coordenação. As imagens são ilustrativas e não retratam crianças atendidas; nenhuma publicação identifica criança nem atribui resultado individual a um doador.</Nota>
            </div>
          </Cartao>
        </div>

        <aside className="flex flex-col gap-6">
          <CartaoRecorrencia rec={rec} />

          {/* Sua Trajetória — linha do tempo + as três insígnias mais próximas do presente */}
          <Cartao className="p-6">
            <h2 className="text-card">Sua Trajetória</h2>
            <LinhaDoTempo meses={cont.meses_consecutivos} />
            <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Marcos recentes">
              {vizinhos(marcos).map((m) => (
                <li key={m.codigo} className="flex flex-col items-center gap-2 text-center">
                  <Insignia codigo={m.codigo} conquistada={m.conquistado} tamanho={52} />
                  <span className={`text-legenda leading-tight ${m.conquistado ? 'text-ink' : 'text-ink-3'}`}>{m.nome}</span>
                </li>
              ))}
            </ol>
            <BotaoLink href="/certificados" className="mt-6 w-full">Ver certificado</BotaoLink>
          </Cartao>

          {/* Mobilize sua Rede */}
          <Cartao className="p-6">
            <h2 className="text-card">Mobilize sua Rede</h2>
            {emb ? (
              <>
                <Rotulo className="mt-4">Seu link de embaixador</Rotulo>
                <p className="mt-2 rounded-md border border-border-soft bg-fill-1 px-3 py-3 text-pequeno">ebenezerconecta.org.br/r/{emb.slug}</p>
                <div className="mt-4"><LinkSeta href="/mobilizar">Ir para a Central do Embaixador</LinkSeta></div>
              </>
            ) : (
              <>
                <p className="text-pequeno mt-3 text-ink-2">Convide pessoas da sua rede com um link identificado e acompanhe quantas passaram a apoiar o Instituto — sem ranking e sem exposição de valores.</p>
                <div className="mt-4"><LinkSeta href="/mobilizar">Conhecer a Central do Embaixador</LinkSeta></div>
              </>
            )}
          </Cartao>
        </aside>
      </div>
    </Moldura>
  );
}

/** Dois últimos marcos conquistados + o próximo pendente (como no Figma). */
function vizinhos<T extends { conquistado: boolean }>(marcos: T[]) {
  const i = marcos.findIndex((m) => !m.conquistado);
  const fim = i === -1 ? marcos.length : i + 1;
  return marcos.slice(Math.max(0, fim - 3), fim);
}

function LinhaDoTempo({ meses }: { meses: number }) {
  const pontos = [{ r: 'Início', m: 0 }, { r: '3m', m: 3 }, { r: '6m', m: 6 }, { r: '12m', m: 12 }, { r: 'Hoje', m: meses }];
  return (
    <div className="mt-5" aria-label={`${meses} meses de apoio contínuo`}>
      <div className="relative flex items-center justify-between">
        <span className="absolute left-1 right-1 top-1/2 h-0.5 -translate-y-1/2 bg-action" aria-hidden />
        {pontos.map((p, i) => (
          <span key={p.r} className={`relative h-3 w-3 rounded-full border-2 ${meses >= p.m ? 'border-action bg-action' : 'border-border-soft bg-surface'} ${i === 4 ? 'h-4 w-4' : ''}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-legenda text-ink-3">{pontos.map((p) => <span key={p.r}>{p.r}</span>)}</div>
    </div>
  );
}

function CartaoRecorrencia({ rec }: { rec: Recorrencia | null }) {
  if (!rec) {
    return (
      <Cartao className="p-6">
        <Rotulo>Sem recorrência ativa</Rotulo>
        <p className="text-card mt-2">Torne seu apoio contínuo</p>
        <p className="text-pequeno mt-2 text-ink-2">A partir de R$ 25 por mês. Altere, pause ou cancele quando quiser, sem justificativa.</p>
        <BotaoLink href="/doar" className="mt-5 w-full">Escolher um valor</BotaoLink>
      </Cartao>
    );
  }
  const pausada = rec.status === 'pausada';
  return (
    <Cartao className="p-6">
      <p className="text-caps flex items-center gap-2 text-ink-2">
        <span aria-hidden className={`h-2 w-2 rounded-full ${pausada ? 'bg-chart-3' : 'bg-accent'}`} />
        {pausada ? 'Recorrência pausada' : 'Recorrência ativa'}
      </p>
      <p className="text-card mt-3">{FREQUENCIA[rec.frequencia][0]!.toUpperCase() + FREQUENCIA[rec.frequencia].slice(1)} · {reais(rec.valor_centavos)}</p>
      <p className="text-pequeno mt-1 text-ink-2">
        {pausada
          ? rec.retomar_em ? `Retoma automaticamente em ${data(rec.retomar_em)}` : 'Pausada sem data de retomada'
          : `Próxima cobrança em ${data(rec.proxima_cobranca)}${rec.meio_ref ? ` · ${maiuscula(rec.meio_ref)}` : ''}`}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <BotaoLink href="/recorrencia" variante="secundario">Alterar</BotaoLink>
        <BotaoLink href="/recorrencia#pausa" variante="secundario">{pausada ? 'Retomar' : 'Pausar'}</BotaoLink>
      </div>
      <div className="mt-4"><Link href="/jornada#historico" className="text-pequeno text-ink-2 hover:text-ink">Ver histórico de contribuições&nbsp;&nbsp;→</Link></div>
    </Cartao>
  );
}
