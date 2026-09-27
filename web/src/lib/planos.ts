// Planos sugeridos na tela de Doação. Conteúdo editorial (nomes e textos do Figma), não regra de negócio:
// o banco aceita qualquer valor entre R$ 25 e R$ 500 (constraint recorrencia_valor_na_escala).
export const PLANOS = [
  { codigo: 'semente', nome: 'Semente do Impacto', centavos: 5000,
    texto: 'Sua entrada na jornada de apoio: ajuda a sustentar materiais e atividades mensais do Laboratório de Sonhos.' },
  { codigo: 'raiz', nome: 'Raiz da Transformação', centavos: 20000,
    texto: 'Fortalece a continuidade dos programas e conta para os marcos da sua própria jornada de impacto.' },
  { codigo: 'guardiao', nome: 'Guardião do Instituto', centavos: 50000,
    texto: 'Consolida seu apoio como guardião, sustentando simultaneamente as duas frentes de atuação do Instituto.' },
] as const;

export const nomeDoPlano = (centavos: number) => PLANOS.find((p) => p.centavos === centavos)?.nome ?? 'Contribuição personalizada';

/** Paradas do seletor de valor (R$). Marcas da régua do Figma: 25, 50, 100, 200, 350, 500. */
export const PARADAS_VALOR = [25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 250, 300, 350, 400, 450, 500];
export const MARCAS_REGUA = [25, 50, 100, 200, 350, 500];
