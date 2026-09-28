// Formato das views e RPCs do banco (supabase/migrations). Espelho manual; gerar com `supabase gen types` quando houver CLI.
export type Frequencia = 'semanal' | 'quinzenal' | 'mensal';

export interface Perfil { id: string; nome_exibicao: string; papel: 'doador' | 'coordenacao'; }
export interface Continuidade {
  doador_id: string; meses_consecutivos: number; primeira_doacao_em: string | null; ultima_doacao_em: string | null;
  doacoes_confirmadas: number; valor_total_centavos: number;
}
export interface Recorrencia {
  id: string; valor_centavos: number; frequencia: Frequencia; status: 'ativa' | 'pausada' | 'cancelada';
  meio: 'pix' | 'cartao' | 'simulado'; meio_ref: string | null; iniciada_em: string; proxima_cobranca: string | null;
  retomar_em: string | null;
}
export interface MarcoTrilha {
  marco_id: string; codigo: string; nome: string; trilha: 'doador' | 'embaixador'; ordem: number;
  meses_requeridos: number | null; doadores_requeridos: number | null; conquistado: boolean; alcancada_em: string | null;
}
export interface Conquista {
  conquista_id: string; codigo: string; nome: string; trilha: 'doador' | 'embaixador'; ordem: number; descricao: string;
  alcancada_em: string; certificado_id: string | null; numero_registro: string | null; emitido_em: string | null;
}
export interface ProximoMarco { codigo: string; nome: string; meses_requeridos: number; meses_atuais: number; progresso: number; meses_faltantes: number; }
export interface ItemHistorico {
  id: string; realizada_em: string; tipo: 'unica' | 'recorrente'; meio: 'pix' | 'cartao' | 'simulado';
  valor_centavos: number; status: string; recibo_numero: string | null; frequencia: Frequencia | null;
}
export interface Publicacao {
  id: string; titulo: string; texto: string; cadencia: 'diaria' | 'semanal' | 'mensal'; publicada_em: string;
  metrica_rotulo: string | null; programa: string; programa_codigo: string; imagem_url: string | null; imagem_alt: string | null;
}
export interface PainelImpacto {
  de: string; ate: string; ultimo_mes: string | null; criancas_atendidas: number; horas_atividade: number; frequencia_media: number; atividades: number;
  programas: { codigo: string; nome: string; faixa_etaria: string; criancas: number | null; horas: number | null; frequencia: number | null; atividades: number | null }[];
}
export interface DoacoesMes { periodo: string; total_centavos: number; doadores: number; }
export interface MetaProgresso { meta_id: string; tipo: 'anual' | 'rede'; rotulo: string; alvo: number; realizado: number; periodo_inicio: string; periodo_fim: string; }
export type Cadencia = 'diaria' | 'semanal' | 'mensal';
export type Rede = 'instagram' | 'whatsapp' | 'x' | 'facebook' | 'linkedin';
export interface ResumoFeed { publicacoes: number; programas: number; diarias: number; semanais: number; mensais: number; }
export interface Embaixador { id: string; slug: string; ativo: boolean; }
export interface RedeEmbaixador {
  embaixador_id: string; slug: string; acessos_pelo_link: number; doadores_mobilizados: number;
  valor_total_centavos: number; recorrentes_originados: number; taxa_conversao: number | null;
}
export interface OrigemCanal { canal: string; acessos: number; doadores: number; }
export interface RedeMes { mes: string; novos_doadores: number; }
export interface Material {
  id: string; titulo: string; descricao: string | null; tipo: 'card' | 'texto' | 'post' | 'assinatura';
  url_storage: string | null; imagem_url: string | null; imagem_alt: string | null; texto_pronto: string | null; ordem: number;
}
