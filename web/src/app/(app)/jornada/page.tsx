import type { Metadata } from 'next';
import Link from 'next/link';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho } from '@/components/shell/Cabecalho';
import { BotaoLink, Cartao, Kpi, Nota, Progresso, Rotulo, Selo } from '@/components/ui';
import { Insignia } from '@/components/dominio/Insignia';
import { conquistas, continuidade, historico, painelImpacto, proximoMarco, sessao, trilha } from '@/lib/dados';
import { MEIO, data, inteiro, mesAno, reais, reaisInteiros } from '@/lib/formato';

export const metadata: Metadata = { title: 'Minha jornada' };

export default async function Jornada({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const { todas } = await searchParams;
  const hoje = new Date().toISOString().slice(0, 10);
  const [{ perfil }, cont, marcos, minhas, prox, hist] = await Promise.all([
    sessao(), continuidade(), trilha(), conquistas(), proximoMarco(), historico(todas ? 500 : 8),
  ]);
  const painel = cont.primeira_doacao_em ? await painelImpacto({ de: cont.primeira_doacao_em, ate: hoje }) : null;
  const doMarco = minhas.filter((c) => c.trilha === 'doador');
  const ultimoCert = doMarco.find((c) => c.numero_registro);
  const mesesJanela = cont.primeira_doacao_em
    ? Math.max(1, Math.round((Date.now() - new Date(cont.primeira_doacao_em).getTime()) / (30.44 * 86_400_000)))
    : 0;

  return (
    <Moldura ativa="jornada">
      <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Minha jornada de impacto" titulo="Sua trajetória de apoio, mês a mês."
        texto="Aqui ficam registradas suas contribuições, as conquistas alcançadas e o resultado coletivo dos programas no período em que você apoia o Instituto.">
        <div className="mt-8 grid grid-cols-4 gap-4">
          <Kpi valor={cont.meses_consecutivos} rotulo="meses de apoio contínuo" />
          <Kpi valor={reaisInteiros(cont.valor_total_centavos)} rotulo={cont.primeira_doacao_em ? `total contribuído desde ${mesAno(cont.primeira_doacao_em)}` : 'total contribuído'} />
          <Kpi valor={doMarco.length} rotulo="conquistas registradas" />
          <Kpi valor={doMarco.filter((c) => c.numero_registro).length} rotulo="certificados disponíveis" />
        </div>
      </Cabecalho>

      <div className="mx-auto grid max-w-[1200px] grid-cols-[760px_1fr] gap-10 px-6 py-12">
        <div className="flex flex-col gap-8">
          <Cartao className="p-7">
            <h2 className="text-secao">Linha do tempo da sua jornada</h2>
            <ul className="mt-5 divide-y divide-border-soft">
              {prox && (
                <li className="grid grid-cols-[100px_1fr_auto] items-center gap-4 py-4">
                  <span className="text-sub">{mesAno(hoje)}</span>
                  <div><p className="text-sub">Hoje — {cont.meses_consecutivos} meses de apoio contínuo</p>
                    <p className="text-legenda text-ink-3">Faltam {prox.meses_faltantes} meses para o marco {prox.nome}</p></div>
                  <Selo>Em curso</Selo>
                </li>
              )}
              {doMarco.map((c) => (
                <li key={c.conquista_id} className="grid grid-cols-[100px_1fr_auto] items-center gap-4 py-4">
                  <span className="text-sub">{mesAno(c.alcancada_em)}</span>
                  <div><p className="text-sub">{c.nome}</p><p className="text-legenda text-ink-3">{c.descricao}</p></div>
                  <Selo tom="marca">Conquista</Selo>
                </li>
              ))}
              {doMarco.length === 0 && <li className="py-4 text-pequeno text-ink-2">Sua primeira contribuição registra o marco Primeiro Passo.</li>}
            </ul>
          </Cartao>

          <Cartao className="p-7">
            <h2 className="text-secao">Conquistas</h2>
            <p className="text-pequeno mt-2 text-ink-2">Cinco marcos definidos pelo programa de reconhecimento. {doMarco.length} alcançados até aqui.</p>
            <ol className="mt-6 grid grid-cols-5 gap-3">
              {marcos.map((m) => (
                <li key={m.codigo} className="flex flex-col items-center gap-2 text-center">
                  <Insignia codigo={m.codigo} conquistada={m.conquistado} tamanho={60} />
                  <span className={`text-legenda leading-tight ${m.conquistado ? 'text-ink' : 'text-ink-3'}`}>{m.nome}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6"><Nota>Os marcos reconhecem tempo de apoio e continuidade — nunca valor doado. Pausar a contribuição não remove conquistas já registradas.</Nota></div>
          </Cartao>
        </div>

        <aside className="flex flex-col gap-6">
          {ultimoCert && (
            <Cartao className="p-6">
              <Rotulo>Certificado disponível</Rotulo>
              <div className="mt-4 rounded-md border border-dashed border-fill-2 bg-fill-1 px-4 py-6 text-center">
                <p className="text-caps text-ink-2">Certificado de reconhecimento</p>
                <p className="mt-2 font-serif text-[20px] font-semibold">{perfil.nome_exibicao}</p>
              </div>
              <p className="text-card mt-4">{ultimoCert.nome}</p>
              <p className="text-legenda mt-1 text-ink-3">Emitido em {data(ultimoCert.emitido_em)} · registro {ultimoCert.numero_registro}</p>
              <BotaoLink href={`/certificados?marco=${ultimoCert.codigo}`} className="mt-5 w-full">Ver certificado</BotaoLink>
              <p className="text-legenda mt-3 text-ink-3">O certificado não expõe valores doados.</p>
            </Cartao>
          )}
          {prox && (
            <Cartao className="p-6 text-center">
              <Rotulo className="text-left">Próximo marco</Rotulo>
              <div className="mt-4 flex justify-center"><Insignia codigo={prox.codigo} conquistada={false} tamanho={60} /></div>
              <p className="text-sub mt-3">{prox.nome}</p>
              <p className="text-pequeno mt-2 text-ink-2">Concedido a quem apoia o Instituto por {prox.meses_requeridos} meses contínuos.</p>
              <div className="mt-4"><Progresso valor={Number(prox.progresso)} rotulo={`Progresso até ${prox.nome}`} /></div>
              <p className="text-legenda mt-2 text-ink-3">{prox.meses_atuais} de {prox.meses_requeridos} meses · faltam {prox.meses_faltantes}</p>
            </Cartao>
          )}
        </aside>
      </div>

      {painel && (
        <div className="border-y border-border-soft bg-surface-muted">
          <div className="mx-auto max-w-[1200px] px-6 py-12">
            <h2 className="text-secao">O que a comunidade sustentou nos seus {mesesJanela} meses</h2>
            <p className="text-pequeno mt-2 text-ink-2">Resultado agregado dos programas entre {mesAno(painel.de)} e {mesAno(painel.ate)} — o período em que você contribuiu.</p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Kpi valor={inteiro(painel.criancas_atendidas)} rotulo="crianças atendidas pelos programas (mês mais recente)" />
              <Kpi valor={inteiro(painel.horas_atividade)} rotulo="horas de atividade realizadas" />
              <Kpi valor={`${inteiro(painel.frequencia_media)}%`} rotulo="frequência média no período" />
            </div>
            <Rotulo className="mt-8">Alcance por programa</Rotulo>
            <ul className="mt-3 flex flex-col gap-3">
              {painel.programas.map((p) => (
                <li key={p.codigo} className="grid grid-cols-[260px_1fr_120px] items-center gap-4 text-pequeno">
                  <span>{p.nome} ({p.faixa_etaria})</span>
                  <Progresso valor={Number(p.criancas ?? 0) / Math.max(1, ...painel.programas.map((x) => Number(x.criancas ?? 0)))} rotulo={p.nome} />
                  <span className="text-right font-semibold">{inteiro(p.criancas)} crianças</span>
                </li>
              ))}
            </ul>
            <div className="mt-6"><Nota>Estes números descrevem o resultado coletivo dos programas no período. Você fez parte da comunidade que os sustentou — eles não representam efeito atribuível a uma contribuição individual, nem identificam qualquer criança.</Nota></div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-12" id="historico">
        <Cartao className="p-7">
          <h2 className="text-secao">Histórico de contribuições</h2>
          <table className="mt-5 w-full text-pequeno">
            <thead className="text-caps text-left text-ink-2">
              <tr className="border-b border-border-soft"><th className="py-3">Data</th><th>Descrição</th><th>Meio</th><th className="text-right">Valor</th><th className="text-right">Recibo</th></tr>
            </thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.id} className="border-b border-border-soft">
                  <td className="py-3.5 font-semibold">{data(h.realizada_em)}</td>
                  <td>{h.tipo === 'recorrente' ? 'Doação recorrente' : 'Doação única'}</td>
                  <td className="text-ink-2">{MEIO[h.meio]}</td>
                  <td className="text-right font-semibold">{reais(h.valor_centavos)}</td>
                  <td className="text-right text-ink-3">{h.recibo_numero}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 flex items-center justify-between rounded-md bg-fill-1 px-5 py-4">
            <span className="text-pequeno">Total desde {mesAno(cont.primeira_doacao_em)} · {cont.doacoes_confirmadas} contribuições</span>
            <span className="text-metrica">{reais(cont.valor_total_centavos)}</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <BotaoLink href="/recorrencia" variante="secundario">Gerenciar recorrência</BotaoLink>
            {!todas && cont.doacoes_confirmadas > hist.length && (
              <Link href="?todas=1#historico" className="text-pequeno text-ink-2 hover:text-ink">Ver todas as {cont.doacoes_confirmadas} contribuições&nbsp;&nbsp;→</Link>
            )}
          </div>
          <div className="mt-5"><Nota>Valores contribuídos são privados por padrão: só você e a coordenação os veem, e eles nunca aparecem em conteúdo compartilhado.</Nota></div>
        </Cartao>
      </div>
    </Moldura>
  );
}
