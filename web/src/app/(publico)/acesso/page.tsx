import type { Metadata } from 'next';
import { Logo } from '@/components/shell/Logo';
import { PainelInstitucional } from '../PainelInstitucional';
import { FormEntrar } from './FormEntrar';

export const metadata: Metadata = { title: 'Entrar' };

export default async function Acesso({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  const { volta } = await searchParams;
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <PainelInstitucional />
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <Logo href="/acesso" />
          <h1 className="text-display mt-8">Entrar na sua conta</h1>
          <p className="text-corpo mt-3 text-ink-2">Acompanhe o impacto dos programas, sua jornada de apoio e seus certificados.</p>
          <FormEntrar volta={volta} />
          <div className="mt-8 border-t border-border-soft pt-6 text-center">
            <p className="text-pequeno text-ink-2">Ainda não apoia o Instituto?&nbsp;&nbsp;<span className="text-ink">Conhecer os programas&nbsp;&nbsp;→</span></p>
            <p className="text-legenda mt-3 text-ink-3">Ao entrar, você concorda com a Política de Privacidade. Seus dados são tratados conforme a LGPD e nunca são compartilhados com terceiros.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
