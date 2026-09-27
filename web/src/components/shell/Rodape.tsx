import { Logo } from './Logo';

const LINKS = ['Sobre o Instituto', 'Prestação de contas', 'Programas', 'Privacidade e LGPD', 'Ajuda'];

export function Rodape() {
  return (
    <footer className="border-t border-border-soft bg-page">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-center justify-between">
          <Logo />
          <nav aria-label="Institucional" className="flex gap-6 text-pequeno text-ink-2">
            {LINKS.map((l) => <span key={l}>{l}</span>)}
          </nav>
        </div>
        <p className="mt-6 text-legenda text-ink-3">
          MVP com dados sintéticos representativos. Números e indicadores são ilustrativos — nenhum valor aqui deve ser tratado como dado real da organização.
          As imagens são ilustrativas e não retratam crianças atendidas pelo Instituto.
        </p>
      </div>
    </footer>
  );
}
