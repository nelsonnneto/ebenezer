import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho } from '@/components/shell/Cabecalho';
import { BotaoLink, Cartao, Chip, Nota } from '@/components/ui';
import { Certificado } from '@/components/dominio/Certificado';
import { conquistas, sessao, trilha } from '@/lib/dados';
import { data } from '@/lib/formato';
import { Imprimir } from './Imprimir';

export const metadata: Metadata = { title: 'Certificados' };

export default async function Certificados({ searchParams }: { searchParams: Promise<{ marco?: string }> }) {
  const { marco } = await searchParams;
  const [{ perfil }, minhas, marcos] = await Promise.all([sessao(), conquistas(), trilha()]);
  const emitidos = minhas.filter((c) => c.trilha === 'doador' && c.numero_registro).sort((a, b) => a.ordem - b.ordem);
  const atual = emitidos.find((c) => c.codigo === marco) ?? emitidos.at(-1);
  const meses = (codigo: string) => marcos.find((m) => m.codigo === codigo)?.meses_requeridos ?? null;

  return (
    <Moldura ativa="jornada">
      <div className="print:hidden">
        <Cabecalho volta={{ href: '/jornada', rotulo: 'Voltar para a jornada' }} rotulo="Meus certificados" titulo="Certificados de reconhecimento"
          texto="Cada marco alcançado gera um certificado nominal, com número de registro verificável. Você pode baixá-lo em PDF ou compartilhá-lo na sua rede." />
      </div>
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_380px] gap-8 px-6 py-10 print:block print:p-0">
        <div className="flex flex-col gap-5">
          {atual ? (
            <>
              <div className="flex flex-wrap gap-2 print:hidden">
                {emitidos.map((c) => <Chip key={c.codigo} href={`?marco=${c.codigo}`} ativo={c.codigo === atual.codigo} scroll={false}>{c.nome}</Chip>)}
              </div>
              <Certificado nome={perfil.nome_exibicao} c={atual} meses={atual.codigo === 'primeiro_passo' ? null : meses(atual.codigo)} />
              <div className="flex items-center gap-3 print:hidden">
                <Imprimir />
                <BotaoLink href={`/compartilhar?conteudo=certificado&marco=${atual.codigo}`} variante="secundario">Compartilhar</BotaoLink>
              </div>
              <div className="print:hidden"><Nota>O certificado não informa valores doados. Ao compartilhar, apenas o marco alcançado e o período de apoio ficam visíveis.</Nota></div>
            </>
          ) : (
            <Cartao className="p-7">
              <h2 className="text-secao">Seu primeiro certificado está a uma contribuição de distância</h2>
              <p className="text-corpo mt-2 text-ink-2">A primeira doação registra o marco Primeiro Passo e emite o seu certificado automaticamente.</p>
              <BotaoLink href="/doar" className="mt-6">Fazer minha primeira doação</BotaoLink>
            </Cartao>
          )}
        </div>

        <aside className="flex flex-col gap-6 print:hidden">
          <Cartao className="p-6">
            <h2 className="text-card">Seus certificados</h2>
            <p className="text-pequeno mt-1 text-ink-2">{emitidos.length} {emitidos.length === 1 ? 'emitido' : 'emitidos'}, {marcos.length - emitidos.length} a caminho.</p>
            <ul className="mt-4 divide-y divide-border-soft">
              {[...marcos].sort((a, b) => b.ordem - a.ordem).map((m) => {
                const c = emitidos.find((x) => x.codigo === m.codigo);
                return (
                  <li key={m.codigo} className="flex items-center justify-between py-3">
                    <div><p className="text-sub">{m.nome}</p>
                      <p className="text-legenda text-ink-3">{c ? `Marco alcançado em ${data(c.alcancada_em)}` : `Disponível ao completar ${m.meses_requeridos} meses`}</p></div>
                    {c ? (c.codigo === atual?.codigo ? <span className="text-sub">Em exibição</span>
                      : <a href={`?marco=${c.codigo}`} className="text-sub hover:text-action">Ver</a>)
                      : <span className="text-sub text-ink-3">Bloqueado</span>}
                  </li>
                );
              })}
            </ul>
          </Cartao>
          <Cartao className="p-6">
            <h2 className="text-card">Sobre este documento</h2>
            <dl className="mt-3 flex flex-col gap-4 text-pequeno">
              <div><dt className="text-sub">O que ele atesta</dt><dd className="mt-1 text-ink-2">A continuidade do seu apoio aos programas do Instituto, pelo período indicado.</dd></div>
              <div><dt className="text-sub">O que ele não atesta</dt><dd className="mt-1 text-ink-2">Não informa valores doados nem atribui a você resultado individual sobre qualquer criança.</dd></div>
              <div><dt className="text-sub">Verificação</dt><dd className="mt-1 text-ink-2">Cada certificado tem número de registro conferível em <a className="underline" href={`/verificar?n=${atual?.numero_registro ?? ''}`}>/verificar</a>, sem expor dados pessoais.</dd></div>
            </dl>
          </Cartao>
        </aside>
      </div>
    </Moldura>
  );
}
