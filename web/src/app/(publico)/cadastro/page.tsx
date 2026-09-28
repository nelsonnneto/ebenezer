import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/shell/Logo';
import { PainelInstitucional } from '../PainelInstitucional';
import { FormCadastro } from './FormCadastro';

export const metadata: Metadata = { title: 'Criar conta' };

export default function Cadastro() {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <PainelInstitucional />
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <Logo href="/conheca" />
          <h1 className="text-display mt-8">Criar sua conta</h1>
          <p className="text-corpo mt-3 text-ink-2">Em seguida você escolhe como apoiar. Pedimos só o necessário para registrar sua contribuição e enviar seus certificados.</p>
          <FormCadastro />
          <div className="mt-8 border-t border-border-soft pt-6 text-center">
            <p className="text-pequeno text-ink-2">Já tem conta?&nbsp;&nbsp;<Link href="/acesso" className="text-ink underline-offset-4 hover:underline">Entrar&nbsp;&nbsp;→</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
