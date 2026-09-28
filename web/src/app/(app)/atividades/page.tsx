import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho } from '@/components/shell/Cabecalho';
import { Cartao, Chip, Kpi, Nota, Progresso, Rotulo } from '@/components/ui';
import { CartaoPublicacao } from '@/components/dominio/CartaoPublicacao';
import { feedFiltrado, painelImpacto, programas, resumoFeed } from '@/lib/dados';
import { data, inteiro, mesAno } from '@/lib/formato';
import type { Cadencia } from '@/lib/tipos';

export const metadata: Metadata = { title: 'Atividades' };

const CADENCIAS: { v: Cadencia; r: string }[] = [{ v: 'diaria', r: 'Diárias' }, { v: 'semanal', r: 'Semanais' }, { v: 'mensal', r: 'Mensais' }];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function Atividades({ searchParams }: { searchParams: Promise<{ cadencia?: Cadencia; programa?: string }> }) {
  const sp = await searchParams;
  const hoje = new Date();
  const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - 6);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const mesAnterior = { de: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), ate: new Date(hoje.getFullYear(), hoje.getMonth(), 0) };

  const [progs, doMes, resumoMes, resumoSemana, boletim, boletimPosts, diarias, semanais, mensais] = await Promise.all([
    programas(),
    painelImpacto({ de: iso(inicioMes), ate: iso(hoje), programa: sp.programa }),
    resumoFeed(iso(inicioMes), iso(hoje)),
    resumoFeed(iso(inicioSemana), iso(hoje)),
    painelImpacto({ de: iso(mesAnterior.de), ate: iso(mesAnterior.ate), programa: sp.programa }),
    resumoFeed(iso(mesAnterior.de), iso(mesAnterior.ate)),
    !sp.cadencia || sp.cadencia === 'diaria' ? feedFiltrado({ cadencia: 'diaria', programa: sp.programa, limite: sp.cadencia ? 12 : 4 }) : [],
    !sp.cadencia || sp.cadencia === 'semanal' ? feedFiltrado({ cadencia: 'semanal', programa: sp.programa, limite: sp.cadencia ? 12 : 2 }) : [],
    sp.cadencia === 'mensal' ? feedFiltrado({ cadencia: 'mensal', programa: sp.programa, limite: 12 }) : [],
  ]);
  const comIndicador = progs.filter((p) => doMes.programas.some((x) => x.codigo === p.codigo) || boletim.programas.some((x) => x.codigo === p.codigo));
  const url = (m: { cadencia?: string | null; programa?: string | null }) => {
    const p = new URLSearchParams();
    const c = m.cadencia === undefined ? sp.cadencia : m.cadencia;
    const g = m.programa === undefined ? sp.programa : m.programa;
    if (c) p.set('cadencia', c);
    if (g) p.set('programa', g);
    return `?${p.toString()}`;
  };

  return (
    <Moldura ativa="atividades">
      <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Atividades dos programas" titulo="O que aconteceu nos programas"
        texto="Publicações da coordenação sobre as atividades realizadas com as crianças — atualizadas diariamente, consolidadas a cada semana e fechadas em um resumo mensal.">
        <div className="mt-8 grid grid-cols-4 gap-4">
          <Kpi valor={resumoMes.publicacoes} rotulo={`publicações em ${hoje.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' })}`} />
          <Kpi valor={inteiro(doMes.horas_atividade)} rotulo="horas de atividade no mês" />
          <Kpi valor={doMes.programas.length} rotulo="programas com indicador" />
          <Kpi valor={`${inteiro(doMes.frequencia_media)}%`} rotulo="frequência média no mês" />
        </div>
      </Cabecalho>

      <div className="border-b border-border-soft bg-surface">
        <nav aria-label="Filtros do feed" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-6 py-4">
          <Chip href={url({ cadencia: null })} ativo={!sp.cadencia} scroll={false}>Todas</Chip>
          {CADENCIAS.map((c) => <Chip key={c.v} href={url({ cadencia: c.v })} ativo={sp.cadencia === c.v} scroll={false}>{c.r}</Chip>)}
          <span aria-hidden className="mx-2 h-6 w-px bg-border-soft" />
          {comIndicador.map((p) => (
            <Chip key={p.codigo} href={url({ programa: sp.programa === p.codigo ? null : p.codigo })} ativo={sp.programa === p.codigo} scroll={false}>{p.nome}</Chip>
          ))}
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-[760px_1fr] gap-10 px-6 py-10">
        <div className="flex flex-col gap-12">
          {diarias.length > 0 && (
            <section>
              <h2 className="text-secao">Atualizações diárias</h2>
              <p className="text-pequeno mt-1 text-ink-2">Registro do dia a dia nas oficinas e no acompanhamento escolar, publicado pela coordenação.</p>
              <div className="mt-5 grid grid-cols-2 gap-5">{diarias.map((p) => <CartaoPublicacao key={p.id} p={p} />)}</div>
            </section>
          )}

          {(!sp.cadencia || sp.cadencia === 'semanal') && (
            <section>
              <h2 className="text-secao">Balanço da semana</h2>
              <p className="text-pequeno mt-1 text-ink-2">Consolidação das publicações entre {data(inicioSemana)} e {data(hoje)}.</p>
              <Cartao className="mt-5 p-6">
                <Rotulo>Semana de {data(inicioSemana)} a {data(hoje)}</Rotulo>
                <dl className="mt-4 grid grid-cols-4 gap-4">
                  {[[resumoSemana.publicacoes, 'publicações'], [resumoSemana.programas, 'programas com atividade'], [resumoSemana.diarias, 'registros diários'], [resumoSemana.semanais, 'consolidações semanais']].map(([v, r]) => (
                    <div key={r}><dd className="text-metrica">{v}</dd><dt className="text-pequeno mt-1 text-ink-2">{r}</dt></div>
                  ))}
                </dl>
              </Cartao>
              {semanais.length > 0 && <div className="mt-5 grid grid-cols-2 gap-5">{semanais.map((p) => <CartaoPublicacao key={p.id} p={p} />)}</div>}
            </section>
          )}

          {(!sp.cadencia || sp.cadencia === 'mensal') && (
            <section>
              <h2 className="text-secao">Resumo do mês</h2>
              <p className="text-pequeno mt-1 text-ink-2">Boletim fechado no primeiro dia útil do mês seguinte, com os indicadores consolidados.</p>
              <Cartao className="mt-5 p-6">
                <Rotulo>{mesAno(mesAnterior.de)}</Rotulo>
                <h3 className="text-card mt-2">Boletim mensal dos programas</h3>
                <div className="mt-5 grid grid-cols-4 gap-4">
                  <Kpi valor={boletimPosts.publicacoes} rotulo="publicações" />
                  <Kpi valor={inteiro(boletim.horas_atividade)} rotulo="horas de atividade" />
                  <Kpi valor={inteiro(boletim.criancas_atendidas)} rotulo="crianças atendidas" />
                  <Kpi valor={`${inteiro(boletim.frequencia_media)}%`} rotulo="frequência média" />
                </div>
                <Rotulo className="mt-6">Atividades por programa</Rotulo>
                <ul className="mt-3 flex flex-col gap-3">
                  {boletim.programas.map((p) => (
                    <li key={p.codigo} className="grid grid-cols-[200px_1fr_110px] items-center gap-4 text-pequeno">
                      <span>{p.nome}</span>
                      <Progresso valor={Number(p.atividades ?? 0) / Math.max(1, ...boletim.programas.map((x) => Number(x.atividades ?? 0)))} rotulo={p.nome} />
                      <span className="text-right font-semibold">{inteiro(p.atividades)} atividades</span>
                    </li>
                  ))}
                </ul>
              </Cartao>
              {mensais.length > 0 && <div className="mt-5 grid grid-cols-2 gap-5">{mensais.map((p) => <CartaoPublicacao key={p.id} p={p} />)}</div>}
            </section>
          )}

          {diarias.length + semanais.length + mensais.length === 0 && sp.cadencia && (
            <p className="text-corpo text-ink-2">Nenhuma publicação com esse filtro ainda.</p>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Cartao className="p-6">
            <h2 className="text-card">Cadência de publicação</h2>
            <p className="text-pequeno mt-1 text-ink-2">Com que frequência cada tipo de conteúdo é publicado.</p>
            <dl className="mt-4 divide-y divide-border-soft text-pequeno">
              {[['Registro diário', 'O que aconteceu no dia, com foto e indicador', 'até 18h'], ['Balanço semanal', 'Números consolidados da semana', 'toda segunda'], ['Boletim mensal', 'Fechamento com indicadores do mês', '1º dia útil']].map(([t, d, q]) => (
                <div key={t} className="flex items-start justify-between gap-4 py-3">
                  <div><dt className="font-semibold">{t}</dt><dd className="text-legenda text-ink-3">{d}</dd></div>
                  <dd className="shrink-0 font-semibold">{q}</dd>
                </div>
              ))}
            </dl>
          </Cartao>
          <Nota>As publicações são institucionais e descrevem atividades dos programas. As imagens são ilustrativas e não retratam crianças atendidas pelo Instituto — nenhuma criança é identificada e nenhum conteúdo atribui resultado individual.</Nota>
        </aside>
      </div>
    </Moldura>
  );
}
