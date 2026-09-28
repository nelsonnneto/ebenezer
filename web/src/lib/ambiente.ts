// Configuração do ambiente, lida só no servidor (proxy, Server Components e Server Actions).
// Aceita os nomes sem prefixo (padrão na Vercel, lidos em tempo de execução) e os com NEXT_PUBLIC_
// (padrão do .env local). Nenhum desses valores é segredo: a chave é a publishable key do Supabase,
// cujo alcance é definido pela RLS.

function ler(...nomes: string[]) {
  for (const n of nomes) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

function obrigatoria(rotulo: string, ...nomes: string[]) {
  const v = ler(...nomes);
  if (!v) throw new Error(`Variável de ambiente ausente: ${rotulo} (defina ${nomes.join(' ou ')}).`);
  return v;
}

export const supabaseUrl = () => obrigatoria('URL do Supabase', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
export const supabaseChave = () =>
  obrigatoria('chave pública do Supabase', 'SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

/** Endereço público do app. Na Vercel, sem SITE_URL, usa o domínio de produção do projeto. */
export function siteUrl() {
  const explicito = ler('SITE_URL', 'NEXT_PUBLIC_SITE_URL');
  if (explicito) return explicito.replace(/\/$/, '');
  const vercel = ler('VERCEL_PROJECT_PRODUCTION_URL');
  return vercel ? `https://${vercel}` : 'http://localhost:3000';
}
