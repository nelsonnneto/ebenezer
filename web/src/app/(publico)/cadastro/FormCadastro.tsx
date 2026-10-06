'use client';
import { useActionState } from 'react';
import { cadastrar, type EstadoCadastro } from '../acoes';
import { Aviso, Botao } from '@/components/ui';

const CAMPO = 'h-[54px] rounded-md border bg-surface px-4 text-corpo placeholder:text-ink-3';
const borda = (erro?: string) => (erro ? 'border-[#c0392b]' : 'border-border');

function ErroCampo({ id, texto }: { id: string; texto?: string }) {
  return texto ? <span id={id} className="text-legenda text-[#8a1c12]">{texto}</span> : null;
}

// Achado A01 dos testes com usuários: após uma tentativa recusada, nome, e-mail e caixas marcadas
// voltam preenchidos (defaultValue a partir do estado) e cada erro aparece junto ao seu campo.
// A senha é a única informação que precisa ser digitada de novo, por segurança.
export function FormCadastro() {
  const [estado, acao, enviando] = useActionState<EstadoCadastro, FormData>(cadastrar, undefined);
  if (estado?.ok) return <div className="mt-8"><Aviso tom="ok">{estado.ok}</Aviso></div>;
  const v = estado?.valores;
  const e = estado?.erros ?? {};
  const senhaDeNovo = !!v && !e.senha;
  return (
    <form action={acao} className="mt-8 flex flex-col gap-5" noValidate>
      {estado?.erro && <Aviso>{estado.erro}</Aviso>}
      <label className="flex flex-col gap-2">
        <span className="text-sub">Como quer ser chamado</span>
        <input name="nome" autoComplete="name" required maxLength={80} placeholder="Nome e sobrenome" defaultValue={v?.nome}
          aria-invalid={!!e.nome} aria-describedby={e.nome ? 'erro-nome' : undefined} className={`${CAMPO} ${borda(e.nome)}`} />
        <ErroCampo id="erro-nome" texto={e.nome} />
        <span className="text-legenda text-ink-3">Aparece só para você e no seu certificado.</span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sub">E-mail</span>
        <input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com.br" defaultValue={v?.email}
          aria-invalid={!!e.email} aria-describedby={e.email ? 'erro-email' : undefined} className={`${CAMPO} ${borda(e.email)}`} />
        <ErroCampo id="erro-email" texto={e.email} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sub">Senha</span>
        <input name="senha" type="password" autoComplete="new-password" required minLength={8}
          aria-invalid={!!e.senha} aria-describedby={e.senha ? 'erro-senha' : undefined} className={`${CAMPO} ${borda(e.senha)}`} />
        <ErroCampo id="erro-senha" texto={e.senha} />
        <span className="text-legenda text-ink-3">
          Mínimo de 8 caracteres.{senhaDeNovo && ' Por segurança, digite a senha novamente.'}
        </span>
      </label>
      <label className="flex items-start gap-3 text-pequeno text-ink-2">
        <input type="checkbox" name="comunicacao" defaultChecked={v?.comunicacao} className="mt-0.5 h-4 w-4 accent-fill-4" />
        Quero receber o boletim mensal e novidades dos programas por e-mail. Posso cancelar quando quiser.
      </label>
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-pequeno text-ink-2">
          <input type="checkbox" name="privacidade" required defaultChecked={v?.privacidade}
            aria-invalid={!!e.privacidade} aria-describedby={e.privacidade ? 'erro-privacidade' : undefined} className="mt-0.5 h-4 w-4 accent-fill-4" />
          Li a Política de Privacidade. Meus dados são tratados conforme a LGPD e não são compartilhados com terceiros.
        </label>
        <ErroCampo id="erro-privacidade" texto={e.privacidade} />
      </div>
      <Botao type="submit" disabled={enviando}>{enviando ? 'Criando conta…' : 'Criar conta e escolher como apoiar'}</Botao>
    </form>
  );
}
