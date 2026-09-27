import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/shell/Logo';
import { BotaoLink } from '@/components/ui';
import { PainelInstitucional } from '../PainelInstitucional';
import { FormRecuperar } from './FormRecuperar';

export const metadata: Metadata = { title: 'Recuperar acesso' };

export default async function Recuperar({ searchParams }: { searchParams: Promise<{ enviado?: string }> }) {
  const { enviado } = await searchParams;
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <PainelInstitucional />
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <Logo href="/acesso" />
          {enviado ? (
            <>
              <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-selected" aria-hidden>
                <svg width="30" height="30" viewBox="0 0 30 30"><path d="M3 8.5h24v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3.5 9 15 18 26.5 9" fill="none" stroke="var(--color-fill-4)" strokeWidth="2"/></svg>
              </div>
              <h1 className="text-display mt-6">Verifique seu e-mail</h1>
              <p className="text-corpo mt-3 text-ink-2">Se <b>{enviado}</b> estiver cadastrado, enviamos um link de redefinição. O link expira em 30 minutos e só pode ser usado uma vez.</p>
              <BotaoLink href="/acesso" className="mt-8 w-full">Voltar para o login</BotaoLink>
              <p className="text-legenda mt-6 text-center text-ink-3">Verifique também a caixa de spam. Nenhuma senha é enviada por e-mail — apenas um link temporário de redefinição.</p>
            </>
          ) : (
            <>
              <h1 className="text-display mt-8">Recuperar acesso</h1>
              <p className="text-corpo mt-3 text-ink-2">Informe o e-mail cadastrado. Enviaremos um link de redefinição de senha válido por 30 minutos.</p>
              <FormRecuperar />
              <div className="mt-8 border-t border-border-soft pt-6 text-center">
                <Link href="/acesso" className="text-pequeno text-ink-2 hover:text-ink">←&nbsp;&nbsp;&nbsp;Voltar para o login</Link>
                <p className="text-legenda mt-3 text-ink-3">Se o e-mail informado não constar na base, nenhuma mensagem é enviada — e nenhuma informação sobre a existência da conta é revelada.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
