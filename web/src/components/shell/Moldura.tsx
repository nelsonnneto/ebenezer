import type { ReactNode } from 'react';
import { sessao } from '@/lib/dados';
import { BarraSuperior, type Secao } from './BarraSuperior';
import { Rodape } from './Rodape';

/** Moldura das telas autenticadas: barra superior global + rodapé. */
export async function Moldura({ ativa, children }: { ativa: Secao; children: ReactNode }) {
  const { perfil } = await sessao();
  return (
    <>
      <BarraSuperior nome={perfil.nome_exibicao} ativa={ativa} />
      <main>{children}</main>
      <Rodape />
    </>
  );
}
