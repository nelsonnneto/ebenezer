import type { Metadata } from 'next';
import { Logo } from '@/components/shell/Logo';
import { Botao, Cartao } from '@/components/ui';
import { supabaseServidor } from '@/lib/supabase/server';
import { data } from '@/lib/formato';

export const metadata: Metadata = { title: 'Verificar certificado' };

/** Verificação pública: devolve só número, marco e datas — nunca nome ou valor (fn_verificar_certificado). */
export default async function Verificar({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  type Registro = { numero_registro: string; marco: string; alcancada_em: string; emitido_em: string };
  let r: Registro | null = null;
  if (n) {
    const sb = await supabaseServidor();
    const { data: linhas } = await sb.rpc('fn_verificar_certificado', { p_numero: n });
    r = ((linhas ?? []) as Registro[])[0] ?? null;
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-6 py-16">
      <Logo href="/acesso" />
      <h1 className="text-display mt-8">Verificar certificado</h1>
      <form className="mt-6 flex gap-3">
        <input name="n" defaultValue={n} placeholder="EC-2026-000148" aria-label="Número de registro"
          className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-corpo uppercase" />
        <Botao>Verificar</Botao>
      </form>
      {n && (
        <Cartao className="mt-6 p-6">
          {r ? (
            <>
              <p className="text-caps text-fill-4">Certificado válido</p>
              <p className="text-card mt-2">{r.marco}</p>
              <p className="text-pequeno mt-2 text-ink-2">Registro {r.numero_registro} · marco alcançado em {data(r.alcancada_em)} · emitido em {data(r.emitido_em)}.</p>
              <p className="text-legenda mt-4 text-ink-3">Por privacidade, a verificação não exibe o nome do titular nem valores contribuídos.</p>
            </>
          ) : <p className="text-corpo">Nenhum certificado encontrado com o número <b>{n}</b>.</p>}
        </Cartao>
      )}
    </div>
  );
}
