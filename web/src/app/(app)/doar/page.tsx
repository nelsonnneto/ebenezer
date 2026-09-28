import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho, Conteudo } from '@/components/shell/Cabecalho';
import { BotaoLink, Cartao, Nota, Rotulo } from '@/components/ui';
import { recorrenciaAtual, sessao } from '@/lib/dados';
import { primeiroNome } from '@/lib/formato';
import { reais, reaisInteiros } from '@/lib/formato';
import { PLANOS } from '@/lib/planos';
import { BotaoPlano, FormDoacaoUnica } from './Formularios';

export const metadata: Metadata = { title: 'Doar' };

export default async function Doar({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const [{ bemvindo }, rec, { perfil }] = await Promise.all([searchParams, recorrenciaAtual(), sessao()]);
  return (
    <Moldura ativa={null}>
      <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Apoiar o Instituto"
        titulo="Escolha como sua doação vai transformar vidas"
        texto="Contribua com um valor mensal recorrente ou faça uma doação única — cada aporte sustenta diretamente os programas do Instituto." />
      <Conteudo>
        {bemvindo && !rec && (
          <Cartao role="status" className="mb-8 border-accent bg-selected p-5">
            <p className="text-corpo">Conta criada. Boas-vindas, <b>{primeiroNome(perfil.nome_exibicao)}</b>! Agora escolha como quer apoiar — você pode alterar ou encerrar a qualquer momento.</p>
          </Cartao>
        )}
        {rec && (
          <Cartao className="mb-8 flex items-center justify-between gap-6 border-accent bg-selected p-5">
            <p className="text-corpo">
              Você já contribui <b>{reais(rec.valor_centavos)} por {rec.frequencia === 'mensal' ? 'mês' : rec.frequencia === 'quinzenal' ? 'quinzena' : 'semana'}</b>
              {rec.status === 'pausada' ? ' (pausada)' : ''}. Escolher um plano abre o ajuste da sua recorrência atual — nada é cobrado em dobro.
            </p>
            <BotaoLink href="/recorrencia" variante="secundario" className="shrink-0">Gerenciar recorrência</BotaoLink>
          </Cartao>
        )}

        <Rotulo>Doação recorrente mensal</Rotulo>
        <div className="mt-4 grid grid-cols-3 gap-6">
          {PLANOS.map((p) => (
            <Cartao key={p.codigo} className="flex flex-col p-6">
              <h2 className="text-card">{p.nome}</h2>
              <p className="mt-3"><span className="text-metrica">{reaisInteiros(p.centavos)}</span> <span className="text-pequeno text-ink-2">/mês</span></p>
              <p className="text-pequeno mt-3 text-ink-2">{p.texto}</p>
              {rec
                ? <div className="mt-auto pt-5"><BotaoLink href={`/recorrencia?valor=${p.centavos}`} className="h-11 px-4">Mudar para {reaisInteiros(p.centavos)} / mês</BotaoLink></div>
                : <BotaoPlano centavos={p.centavos} rotulo={`Doar ${reaisInteiros(p.centavos)} / mês`} />}
            </Cartao>
          ))}
        </div>
        <p className="text-legenda mt-3 text-ink-3">Prefere outro valor mensal? Escolha qualquer quantia entre R$ 25 e R$ 500 em Gerenciar Recorrência depois da primeira contribuição.</p>

        <Rotulo className="mt-10">Doação única</Rotulo>
        <Cartao className="mt-4 p-7">
          <h2 className="text-secao">Doação única</h2>
          <p className="text-corpo mt-2 text-ink-2">Sem recorrência: você escolhe livremente o valor da sua contribuição pontual.</p>
          <FormDoacaoUnica />
        </Cartao>

        <div className="mt-6"><Nota>MVP com cobrança simulada: nenhuma cobrança real é processada nesta tela. Valores e planos são ilustrativos. A recorrência pode ser alterada, pausada ou cancelada a qualquer momento, sem justificativa.</Nota></div>
      </Conteudo>
    </Moldura>
  );
}
