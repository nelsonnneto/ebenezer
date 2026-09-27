// Insígnias dos marcos (Figma: componente Badge, 5 marcos × 2 estados). Glifos simples, cor por estado.
const GLIFOS: Record<string, React.ReactNode> = {
  primeiro_passo: <path d="M12 20c0-4 1-7 4-9m-4 9c0-3-2-6-6-7 0 3 2 6 6 7zm4-9c3 0 5-2 5-6-3 0-5 2-5 6z" />,
  impacto_continuo: <path d="M7 12a5 5 0 0 1 9-3l1.5 1.5M17 12a5 5 0 0 1-9 3L6.5 13.5M17.5 7v3.5H14M6.5 17v-3.5H10" />,
  raizes_fortes: <path d="M12 3v9m0 0c-2 0-4-1.5-4-4 2 0 4 1.5 4 4zm0 0c2 0 4-1.5 4-4-2 0-4 1.5-4 4zm0 0v3m0 0-3 5m3-5 3 5m-3-5v6" />,
  guardiao_comunidade: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zm-2.5 8.5a1.5 1.5 0 1 0 0-.01m5 0a1.5 1.5 0 1 0 0-.01M8 16c.5-1.5 1.5-2 2-2m6 2c-.5-1.5-1.5-2-2-2" />,
  guardiao_educacao: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM8.5 10.5 12 9l3.5 1.5V15L12 13.5 8.5 15z" />,
  voz_da_causa: <path d="M5 10v4h3l5 4V6L8 10zm11-1a4 4 0 0 1 0 6" />,
  conector: <path d="M12 6a2 2 0 1 0 0 .01M6 17a2 2 0 1 0 0 .01M18 17a2 2 0 1 0 0 .01M12 8v4m0 0-5 4m5-4 5 4" />,
  mobilizador: <path d="M9 9a2.5 2.5 0 1 0 0 .01M5 18c0-2.5 2-4 4-4s4 1.5 4 4m3-8v6m-3-3h6" />,
};

export function Insignia({ codigo, conquistada, tamanho = 56 }: { codigo: string; conquistada: boolean; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="28" r="26" fill={conquistada ? 'var(--color-action)' : 'var(--color-surface-muted)'}
        stroke={conquistada ? 'var(--color-fill-4)' : 'var(--color-border-soft)'} strokeWidth="2" />
      <circle cx="28" cy="28" r="20" fill="none" stroke={conquistada ? 'var(--color-fill-2)' : 'var(--color-border-soft)'} strokeWidth="1.5" />
      <g transform="translate(16 16)" fill="none" stroke={conquistada ? '#fff' : 'var(--color-ink-3)'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {GLIFOS[codigo] ?? <circle cx="12" cy="12" r="4" />}
      </g>
    </svg>
  );
}
