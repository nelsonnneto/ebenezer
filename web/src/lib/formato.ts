// Formatação pt-BR. Só apresentação: nenhum cálculo de negócio aqui.
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaInteira = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** 156000 → "R$ 1.560,00" */
export const reais = (centavos: number | null | undefined) => moeda.format((centavos ?? 0) / 100).replace(/ /g, ' ');
/** 156000 → "R$ 1.560" */
export const reaisInteiros = (centavos: number | null | undefined) => moedaInteira.format((centavos ?? 0) / 100).replace(/ /g, ' ');
/** 4320 → "4.320" */
export const inteiro = (n: number | string | null | undefined) => numero.format(Number(n ?? 0));

function paraData(d: string | Date) {
  if (d instanceof Date) return d;
  // 'YYYY-MM-DD' puro é data civil: evita deslocamento de fuso
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
}
/** "2026-09-12" → "12/09/2026" */
export const data = (d: string | Date | null | undefined) => (d ? paraData(d).toLocaleDateString('pt-BR') : '—');
/** "2026-09-12" → "set/2026" */
export const mesAno = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const x = paraData(d);
  return `${MESES[x.getMonth()]}/${x.getFullYear()}`;
};
/** "2026-09-12" → "set/26" */
export const mesAnoCurto = (d: string | Date) => {
  const x = paraData(d);
  return `${MESES[x.getMonth()]}/${String(x.getFullYear()).slice(2)}`;
};
export const FREQUENCIA: Record<string, string> = { semanal: 'semanal', quinzenal: 'quinzenal', mensal: 'mensal' };
export const MEIO: Record<string, string> = { pix: 'Pix', cartao: 'Cartão', simulado: 'Simulado' };
export const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
export const primeiroNome = (nome: string) => nome.split(/\s+/)[0] ?? nome;

/** "cartão final 4417" → "Cartão final 4417" */
export const maiuscula = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
