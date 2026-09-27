import type { Metadata } from 'next';
import { Moldura } from '@/components/shell/Moldura';
import { Cabecalho, Conteudo } from '@/components/shell/Cabecalho';
import { BotaoLink, Cartao } from '@/components/ui';

export const metadata: Metadata = { title: 'Área do embaixador' };

// Tela do Bloco 3 do plano. Mantida navegável para que nenhum link da barra superior quebre.
export default function Pagina() {
  return (
    <Moldura ativa={'mobilizar'}>
      <Cabecalho volta={{ href: '/', rotulo: 'Voltar para a Home' }} rotulo="Área do embaixador" titulo="Multiplique seu impacto" texto="Link identificado, materiais aprovados e o painel de conversão da sua rede." />
      <Conteudo>
        <Cartao className="p-7">
          <p className="text-caps text-ink-2">Em construção · Bloco 3</p>
          <p className="text-corpo mt-2 text-ink-2">Esta tela entra na próxima etapa do MVP. O fluxo principal de doação, recorrência, jornada e certificados já está disponível.</p>
          <BotaoLink href="/" variante="secundario" className="mt-6">Voltar para a Home</BotaoLink>
        </Cartao>
      </Conteudo>
    </Moldura>
  );
}
