import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho, Conteudo } from '@/components/shell/Cabecalho';
import { Aviso, Botao, BotaoLink, Cartao, Nota } from '@/components/ui';
import { eventosRecorrencia, recorrenciaAtual } from '@/lib/dados';
import { MEIO, data, maiuscula, reais } from '@/lib/formato';
import { pausarRecorrencia, retomarRecorrencia } from '../acoes-contribuicao';
import { Ajuste } from './Ajuste';
import { Encerrar } from './Encerrar';

export const metadata: Metadata = { title: 'Gerenciar recorrência' };

const OK: Record<string, string> = {
  alterada: 'Alteração registrada. O novo valor vale a partir da próxima cobrança.',
  pausada: 'Contribuição pausada. Suas conquistas continuam registradas.',
  retomada: 'Contribuição retomada. Obrigado por continuar.',
  cancelada: 'Recorrência cancelada. Suas conquistas e certificados permanecem.',
};
const EVENTO: Record<string, string> = { criada: 'Recorrência iniciada', alterada: 'Valor ou frequência alterados', pausada: 'Pausada', retomada: 'Retomada', cancelada: 'Cancelada' };

export default async function Recorrencia({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string; valor?: string }> }) {
  const sp = await searchParams;
  const rec = await recorrenciaAtual();
  const eventos = rec ? await eventosRecorrencia(rec.id) : [];

  return (
    <Moldura ativa="jornada">
      <Cabecalho volta={{ href: '/jornada', rotulo: 'Voltar para a jornada' }} rotulo="Minha recorrência" titulo="Ajuste sua contribuição"
        texto="Você pode alterar o valor e a periodicidade quando quiser. A mudança passa a valer na próxima cobrança e não remove nenhuma conquista já registrada." />
      <Conteudo estreito>
        <div className="flex flex-col gap-6">
          {sp.ok && OK[sp.ok] && <Aviso tom="ok">{OK[sp.ok]}</Aviso>}
          {sp.erro && <Aviso>{sp.erro}</Aviso>}

          {!rec && (
            <Cartao className="p-7">
              <h2 className="text-secao">Você não tem uma recorrência ativa</h2>
              <p className="text-corpo mt-2 text-ink-2">Uma contribuição mensal a partir de R$ 25 sustenta os programas e conta para os marcos da sua jornada.</p>
              <BotaoLink href="/doar" className="mt-6">Escolher um valor</BotaoLink>
            </Cartao>
          )}

          {rec?.status === 'ativa' && (
            <Ajuste valorAtual={rec.valor_centavos} freqAtual={rec.frequencia} valorSugerido={Number(sp.valor) || undefined}
              meio={maiuscula(rec.meio_ref ?? MEIO[rec.meio]!)} proxima={data(rec.proxima_cobranca)}
              diaCobranca={String(new Date(`${rec.proxima_cobranca}T12:00:00`).getDate())} />
          )}

          {rec?.status === 'ativa' && (
            <Cartao className="p-7" id="pausa">
              <h2 className="text-card">Precisa de uma pausa?</h2>
              <p className="text-pequeno mt-2 text-ink-2">Pausar não cancela sua recorrência nem remove suas conquistas. A contribuição volta automaticamente ao fim do período escolhido.</p>
              <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((m) => (
                  <form key={m} action={pausarRecorrencia}>
                    <input type="hidden" name="meses" value={m} />
                    <button className="h-9 rounded-md border border-border px-3 text-pequeno hover:bg-surface-muted">{m} {m === 1 ? 'mês' : 'meses'}</button>
                  </form>
                ))}
              </div>
            </Cartao>
          )}

          {rec?.status === 'pausada' && (
            <Cartao className="p-7" id="pausa">
              <h2 className="text-secao">Sua contribuição está pausada</h2>
              <p className="text-corpo mt-2 text-ink-2">
                {reais(rec.valor_centavos)} · {rec.frequencia}. {rec.retomar_em ? `Retoma automaticamente em ${data(rec.retomar_em)}.` : 'Sem data de retomada.'} Seus meses de apoio contínuo ficam congelados, não zerados.
              </p>
              <form action={retomarRecorrencia} className="mt-6"><Botao>Retomar agora</Botao></form>
            </Cartao>
          )}

          {rec && eventos.length > 0 && (
            <Cartao className="p-7">
              <h2 className="text-card">Histórico de alterações</h2>
              <ul className="mt-3 divide-y divide-border-soft text-pequeno">
                {eventos.map((e) => (
                  <li key={e.id} className="flex justify-between py-3">
                    <span>{EVENTO[e.tipo] ?? e.tipo}{e.tipo === 'alterada' && e.valor_novo ? ` · ${reais(e.valor_anterior)} → ${reais(e.valor_novo)}${e.freq_nova !== e.freq_anterior ? ` · ${e.freq_anterior} → ${e.freq_nova}` : ''}` : ''}</span>
                    <span className="text-ink-3">{data(e.em)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border-soft pt-5"><Encerrar /></div>
            </Cartao>
          )}

          <Nota>Alterar, reduzir ou pausar a contribuição não gera cobrança adicional, não rebaixa seu nível e não remove marcos já conquistados. O produto reconhece continuidade — não penaliza interrupção.</Nota>
        </div>
      </Conteudo>
    </Moldura>
  );
}
