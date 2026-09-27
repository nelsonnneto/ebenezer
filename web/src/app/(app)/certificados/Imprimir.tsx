'use client';
import { Botao } from '@/components/ui';

/** "Baixar PDF" pelo diálogo de impressão do navegador — o CSS de impressão isola o certificado. */
export function Imprimir() {
  return <Botao type="button" onClick={() => window.print()}>Baixar certificado (PDF)</Botao>;
}
